import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeacherProjectGroup, TeacherInProject } from '../../models/teacher.models';
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
  project = input.required<TeacherProjectGroup>();
  expanded = input(false);

  toggle = output<void>();
  uploadPhoto = output<TeacherInProject>();
  viewPhoto = output<TeacherInProject>();

  readonly ICONS = ICONS;

  onToggle(): void {
    this.toggle.emit();
  }

  onUpload(teacher: TeacherInProject): void {
    this.uploadPhoto.emit(teacher);
  }

  onViewPhoto(teacher: TeacherInProject, event: MouseEvent): void {
    event.stopPropagation();
    if (teacher.photoUrl) {
      this.viewPhoto.emit(teacher);
    }
  }
}
