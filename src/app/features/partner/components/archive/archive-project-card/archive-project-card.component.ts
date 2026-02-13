import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ArchiveSchoolGroup, ArchivePersonInSchool, ArchiveConfig } from '../../../models/archive.models';
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
