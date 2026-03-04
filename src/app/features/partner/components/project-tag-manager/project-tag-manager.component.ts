import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, computed, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { NgTemplateOutlet } from '@angular/common';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PartnerTagService } from '../../services/partner-tag.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { createBackdropHandler, BackdropHandler } from '../../../../shared/utils/dialog.util';
import type { ProjectTag } from '../../models/partner.models';

type DropdownState = 'list' | 'create' | 'edit';

/**
 * Projekt címke kezelő — Command palette stílusú dropdown.
 * Keresőmező fent, Enter = toggle, Tab = új címke, nyíl = navigáció.
 */
@Component({
  selector: 'app-project-tag-manager',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NgTemplateOutlet, ConfirmDialogComponent],
  templateUrl: './project-tag-manager.component.html',
  styleUrl: './project-tag-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTagManagerComponent {
  readonly ICONS = ICONS;
  private readonly tagService = inject(PartnerTagService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Projekt ID */
  readonly projectId = input.required<number>();

  /** Aktuális címkék */
  readonly tags = input<ProjectTag[]>([]);

  /** Címkék változtak */
  readonly tagsChanged = output<ProjectTag[]>();

  /** Összes elérhető címke */
  allTags = signal<ProjectTag[]>([]);

  /** Dropdown állapot */
  dropdownState = signal<DropdownState | null>(null);

  /** Keresés */
  searchQuery = signal('');

  /** Keyboard navigáció — aktív sor index */
  activeIndex = signal(-1);

  /** Form signal-ek (create + edit közös) */
  formName = signal('');
  formColor = signal('slate');
  editingTag = signal<ProjectTag | null>(null);

  /** Törlés megerősítő */
  showDeleteConfirm = signal(false);

  /** Szűrt címkék */
  readonly filteredTags = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tags = this.allTags();
    if (!query) return tags;
    return tags.filter(t => t.name.toLowerCase().includes(query));
  });

  /** Hozzárendelt tag ID-k Set-je */
  readonly assignedTagIds = computed(() => new Set(this.tags().map(t => t.id)));

  /** Van-e keresési találat ami nem létező tag — Tab-bal létrehozható */
  readonly canCreateFromSearch = computed(() => {
    const query = this.searchQuery().trim();
    if (!query) return false;
    return !this.allTags().some(t => t.name.toLowerCase() === query.toLowerCase());
  });

  readonly TAG_COLORS: { value: string; label: string }[] = [
    { value: 'slate', label: 'Szürke' },
    { value: 'red', label: 'Piros' },
    { value: 'orange', label: 'Narancs' },
    { value: 'amber', label: 'Sárga' },
    { value: 'green', label: 'Zöld' },
    { value: 'blue', label: 'Kék' },
    { value: 'indigo', label: 'Indigó' },
    { value: 'purple', label: 'Lila' },
    { value: 'pink', label: 'Rózsaszín' },
  ];

  readonly backdropHandler: BackdropHandler = createBackdropHandler(
    () => this.closeDropdown(),
    'tag-backdrop'
  );

  toggleDropdown(): void {
    if (this.dropdownState()) {
      this.closeDropdown();
    } else {
      this.dropdownState.set('list');
      this.searchQuery.set('');
      this.activeIndex.set(-1);
      this.loadAllTags();
      setTimeout(() => this.searchInput()?.nativeElement.focus());
    }
  }

  closeDropdown(): void {
    this.dropdownState.set(null);
    this.searchQuery.set('');
    this.activeIndex.set(-1);
    this.resetForm();
  }

  loadAllTags(): void {
    this.tagService.getTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.allTags.set(res.data) });
  }

  /** Keyboard kezelés a keresőmezőben */
  onSearchKeydown(event: KeyboardEvent): void {
    const tags = this.filteredTags();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => Math.min(i + 1, tags.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, -1));
        break;

      case 'Enter': {
        event.preventDefault();
        const idx = this.activeIndex();
        if (idx >= 0 && idx < tags.length) {
          this.toggleTag(tags[idx]);
        } else if (tags.length === 1) {
          // Ha csak 1 találat van, azt toggle-öljük
          this.toggleTag(tags[0]);
        }
        break;
      }

      case 'Tab':
        event.preventDefault();
        if (this.canCreateFromSearch()) {
          // Gyors létrehozás a keresőmezőből
          this.formName.set(this.searchQuery().trim());
          this.formColor.set('slate');
          this.dropdownState.set('create');
        } else {
          this.startCreate();
        }
        break;

      case 'Escape':
        this.closeDropdown();
        break;
    }
  }

  /** Tag toggle */
  toggleTag(tag: ProjectTag): void {
    const assigned = this.assignedTagIds();
    const newTags = assigned.has(tag.id)
      ? this.tags().filter(t => t.id !== tag.id)
      : [...this.tags(), tag];
    this.syncTags(newTags);
  }

  /** Pill X gomb */
  removeTag(tagId: number): void {
    const newTags = this.tags().filter(t => t.id !== tagId);
    this.syncTags(newTags);
  }

  /** Állapotváltások */
  startCreate(): void {
    this.resetForm();
    this.dropdownState.set('create');
  }

  startEdit(tag: ProjectTag, event: MouseEvent): void {
    event.stopPropagation();
    this.editingTag.set(tag);
    this.formName.set(tag.name);
    this.formColor.set(tag.color);
    this.dropdownState.set('edit');
  }

  backToList(): void {
    this.resetForm();
    this.dropdownState.set('list');
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  /** Form mentés */
  saveForm(): void {
    const name = this.formName().trim();
    if (!name) return;

    const editing = this.editingTag();
    if (editing) {
      this.tagService.updateTag(editing.id, { name, color: this.formColor() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            const updated = res.data;
            this.allTags.update(tags => tags.map(t => t.id === updated.id ? updated : t));
            if (this.assignedTagIds().has(updated.id)) {
              const newTags = this.tags().map(t => t.id === updated.id ? updated : t);
              this.tagsChanged.emit(newTags);
            }
            this.backToList();
          },
        });
    } else {
      this.tagService.createTag({ name, color: this.formColor() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.allTags.update(tags => [...tags, res.data]);
            this.backToList();
          },
        });
    }
  }

  /** Törlés */
  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    this.showDeleteConfirm.set(false);
    if (result.action !== 'confirm') return;

    const editing = this.editingTag();
    if (!editing) return;

    this.tagService.deleteTag(editing.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allTags.update(tags => tags.filter(t => t.id !== editing.id));
          if (this.assignedTagIds().has(editing.id)) {
            const newTags = this.tags().filter(t => t.id !== editing.id);
            this.syncTags(newTags);
          }
          this.backToList();
        },
      });
  }

  private resetForm(): void {
    this.formName.set('');
    this.formColor.set('slate');
    this.editingTag.set(null);
    this.showDeleteConfirm.set(false);
  }

  private syncTags(newTags: ProjectTag[]): void {
    const tagIds = newTags.map(t => t.id);
    this.tagService.syncProjectTags(this.projectId(), tagIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.tagsChanged.emit(res.data) });
  }
}
