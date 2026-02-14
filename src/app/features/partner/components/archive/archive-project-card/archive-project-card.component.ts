import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ArchiveSchoolGroup, ArchivePersonInSchool, ArchiveConfig, ArchiveClassGroup } from '../../../models/archive.models';
import { ICONS } from '../../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-archive-project-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './archive-project-card.component.html',
  styleUrl: './archive-project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveProjectCardComponent {
  school = input.required<ArchiveSchoolGroup>();
  config = input.required<ArchiveConfig>();
  expanded = input(false);
  isSyncing = input(false);

  syncableCount = computed(() =>
    this.school().items.filter(t => t.hasSyncablePhoto).length
  );

  toggle = output<void>();
  syncPhotos = output<void>();
  syncSingleItem = output<ArchivePersonInSchool>();
  uploadPhoto = output<ArchivePersonInSchool>();
  viewPhoto = output<ArchivePersonInSchool>();
  markNoPhoto = output<ArchivePersonInSchool>();
  undoNoPhoto = output<ArchivePersonInSchool>();

  readonly ICONS = ICONS;

  expandedClassNames = signal<Set<string>>(new Set());

  classGroups = computed<ArchiveClassGroup[]>(() => {
    const items = this.school().items;
    const map = new Map<string, ArchivePersonInSchool[]>();
    for (const item of items) {
      const key = item.className?.trim() || '__no_class__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    const groups: ArchiveClassGroup[] = [];
    for (const [key, students] of map) {
      groups.push({
        className: key,
        displayName: key === '__no_class__' ? 'Osztály nélkül' : key,
        studentCount: students.length,
        missingPhotoCount: students.filter(s => !s.hasPhoto).length,
        items: students,
      });
    }
    return groups.sort((a, b) => {
      if (a.className === '__no_class__') return 1;
      if (b.className === '__no_class__') return -1;
      return a.className.localeCompare(b.className, 'hu');
    });
  });

  hasMultipleClasses = computed(() => this.classGroups().length > 1);

  isClassExpanded(className: string): boolean {
    if (!this.hasMultipleClasses()) return true;
    return this.expandedClassNames().has(className);
  }

  toggleClass(className: string): void {
    this.expandedClassNames.update(set => {
      const next = new Set(set);
      next.has(className) ? next.delete(className) : next.add(className);
      return next;
    });
  }

  expandAllClasses(): void {
    this.expandedClassNames.set(new Set(this.classGroups().map(g => g.className)));
  }

  collapseAllClasses(): void {
    this.expandedClassNames.set(new Set());
  }

  onToggle(): void {
    this.toggle.emit();
  }

  onSync(event: MouseEvent): void {
    event.stopPropagation();
    this.syncPhotos.emit();
  }

  onUpload(item: ArchivePersonInSchool): void {
    this.uploadPhoto.emit(item);
  }

  onViewPhoto(item: ArchivePersonInSchool, event: MouseEvent): void {
    event.stopPropagation();
    if (item.photoUrl) {
      this.viewPhoto.emit(item);
    }
  }

  onMarkNoPhoto(item: ArchivePersonInSchool): void {
    this.markNoPhoto.emit(item);
  }

  onUndoNoPhoto(item: ArchivePersonInSchool): void {
    this.undoNoPhoto.emit(item);
  }

  onSyncSingle(item: ArchivePersonInSchool): void {
    this.syncSingleItem.emit(item);
  }
}
