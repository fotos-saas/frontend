import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
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

  toggle = output<void>();
  uploadPhoto = output<TeacherInSchool>();
  viewPhoto = output<TeacherInSchool>();

  readonly ICONS = ICONS;

  onToggle(): void {
    this.toggle.emit();
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
}
