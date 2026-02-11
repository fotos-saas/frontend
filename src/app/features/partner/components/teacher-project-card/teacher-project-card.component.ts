import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeacherSchoolGroup, TeacherInSchool } from '../../models/teacher.models';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-teacher-project-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './teacher-project-card.component.html',
  styleUrl: './teacher-project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherProjectCardComponent {
  school = input.required<TeacherSchoolGroup>();
  expanded = input(false);
  isSyncing = input(false);

  syncableCount = computed(() =>
    this.school().teachers.filter(t => t.hasSyncablePhoto).length
  );

  toggle = output<void>();
  syncPhotos = output<void>();
  syncSingleTeacher = output<TeacherInSchool>();
  uploadPhoto = output<TeacherInSchool>();
  viewPhoto = output<TeacherInSchool>();
  markNoPhoto = output<TeacherInSchool>();
  undoNoPhoto = output<TeacherInSchool>();

  readonly ICONS = ICONS;

  onToggle(): void {
    this.toggle.emit();
  }

  onSync(event: MouseEvent): void {
    event.stopPropagation();
    this.syncPhotos.emit();
  }

  onUpload(teacher: TeacherInSchool): void {
    this.uploadPhoto.emit(teacher);
  }

  onViewPhoto(teacher: TeacherInSchool, event: MouseEvent): void {
    event.stopPropagation();
    if (teacher.photoUrl) {
      this.viewPhoto.emit(teacher);
    }
  }

  onMarkNoPhoto(teacher: TeacherInSchool): void {
    this.markNoPhoto.emit(teacher);
  }

  onUndoNoPhoto(teacher: TeacherInSchool): void {
    this.undoNoPhoto.emit(teacher);
  }

  onSyncSingle(teacher: TeacherInSchool): void {
    this.syncSingleTeacher.emit(teacher);
  }
}
