import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentSchoolGroup, StudentInSchool } from '../../models/student.models';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-student-project-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './student-project-card.component.html',
  styleUrl: './student-project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProjectCardComponent {
  school = input.required<StudentSchoolGroup>();
  expanded = input(false);

  toggle = output<void>();
  uploadPhoto = output<StudentInSchool>();
  viewPhoto = output<StudentInSchool>();
  markNoPhoto = output<StudentInSchool>();
  undoNoPhoto = output<StudentInSchool>();

  readonly ICONS = ICONS;

  onToggle(): void {
    this.toggle.emit();
  }

  onUpload(student: StudentInSchool): void {
    this.uploadPhoto.emit(student);
  }

  onViewPhoto(student: StudentInSchool, event: MouseEvent): void {
    event.stopPropagation();
    if (student.photoUrl) {
      this.viewPhoto.emit(student);
    }
  }

  onMarkNoPhoto(student: StudentInSchool): void {
    this.markNoPhoto.emit(student);
  }

  onUndoNoPhoto(student: StudentInSchool): void {
    this.undoNoPhoto.emit(student);
  }
}
