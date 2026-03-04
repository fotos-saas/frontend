import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, computed } from '@angular/core';
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
 * Projekt címke kezelő - Linear/Notion-inspirált dropdown.
 * 3 állapotú state machine: list → create/edit.
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

  /** Projekt ID */
  readonly projectId = input.required<number>();

  /** Aktuális címkék */
  readonly tags = input<ProjectTag[]>([]);

  /** Címkék változtak */
  readonly tagsChanged = output<ProjectTag[]>();

  /** Összes elérhető címke a partnernek */
  allTags = signal<ProjectTag[]>([]);

  /** Dropdown állapot (state machine) */
  dropdownState = signal<DropdownState | null>(null);

  /** Keresés */
  searchQuery = signal('');

  /** Form signal-ek (create + edit közös) */
  formName = signal('');
  formColor = signal('slate');
  editingTag = signal<ProjectTag | null>(null);

  /** Törlés megerősítő */
  showDeleteConfirm = signal(false);

  /** Szűrt címkék — keresés szerinti */
  readonly filteredTags = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tags = this.allTags();
    if (!query) return tags;
    return tags.filter(t => t.name.toLowerCase().includes(query));
  });

  /** Hozzárendelt tag ID-k Set-je (gyors lookup) */
  readonly assignedTagIds = computed(() => {
    return new Set(this.tags().map(t => t.id));
  });

  /** Keresőmező csak 5+ tagnél */
  readonly showSearch = computed(() => this.allTags().length >= 5);

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

  /** Backdrop handler — szövegkijelölés-safe bezárás */
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
      this.loadAllTags();
    }
  }

  closeDropdown(): void {
    this.dropdownState.set(null);
    this.searchQuery.set('');
    this.resetForm();
  }

  loadAllTags(): void {
    this.tagService.getTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allTags.set(res.data),
      });
  }

  /** Tag toggle — assign/unassign egy kattintással */
  toggleTag(tag: ProjectTag): void {
    const assigned = this.assignedTagIds();
    const newTags = assigned.has(tag.id)
      ? this.tags().filter(t => t.id !== tag.id)
      : [...this.tags(), tag];
    this.syncTags(newTags);
  }

  /** Pill X gomb — eltávolítás */
  removeTag(tagId: number): void {
    const newTags = this.tags().filter(t => t.id !== tagId);
    this.syncTags(newTags);
  }

  /** Állapotváltások */
  startCreate(): void {
    this.resetForm();
    this.dropdownState.set('create');
  }

  startEdit(tag: ProjectTag): void {
    this.editingTag.set(tag);
    this.formName.set(tag.name);
    this.formColor.set(tag.color);
    this.dropdownState.set('edit');
  }

  backToList(): void {
    this.resetForm();
    this.dropdownState.set('list');
  }

  /** Form mentés (create vagy edit) */
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
            // Frissítjük a projekt címkéit is ha szükséges
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

  /** Törlés ConfirmDialog-gal */
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
          // Ha hozzá volt rendelve, eltávolítjuk
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
      .subscribe({
        next: (res) => {
          this.tagsChanged.emit(res.data);
        },
      });
  }
}
