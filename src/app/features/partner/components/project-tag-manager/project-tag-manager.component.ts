import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PartnerTagService } from '../../services/partner-tag.service';
import type { ProjectTag } from '../../models/partner.models';

/**
 * Projekt címke kezelő - pill badge-ek + hozzáadás/létrehozás dropdown.
 */
@Component({
  selector: 'app-project-tag-manager',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
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

  /** Dropdown nyitva */
  dropdownOpen = signal(false);

  /** Új címke létrehozás mód */
  creatingNew = signal(false);
  newTagName = signal('');
  newTagColor = signal('slate');

  /** Szűrt elérhető címkék (amelyek még nincsenek hozzárendelve) */
  readonly availableTags = computed(() => {
    const currentIds = new Set(this.tags().map(t => t.id));
    return this.allTags().filter(t => !currentIds.has(t.id));
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

  toggleDropdown(): void {
    const isOpen = !this.dropdownOpen();
    this.dropdownOpen.set(isOpen);
    if (isOpen) {
      this.loadAllTags();
      this.creatingNew.set(false);
    }
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
    this.creatingNew.set(false);
  }

  loadAllTags(): void {
    this.tagService.getTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allTags.set(res.data),
      });
  }

  /** Meglévő címke hozzáadása */
  addTag(tag: ProjectTag): void {
    const newTags = [...this.tags(), tag];
    this.syncTags(newTags);
  }

  /** Címke eltávolítása */
  removeTag(tagId: number): void {
    const newTags = this.tags().filter(t => t.id !== tagId);
    this.syncTags(newTags);
  }

  /** Új címke létrehozása és hozzáadása */
  createAndAddTag(): void {
    const name = this.newTagName().trim();
    if (!name) return;

    this.tagService.createTag({ name, color: this.newTagColor() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const createdTag = res.data;
          this.allTags.update(tags => [...tags, createdTag]);
          this.addTag(createdTag);
          this.newTagName.set('');
          this.newTagColor.set('slate');
          this.creatingNew.set(false);
        },
      });
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
