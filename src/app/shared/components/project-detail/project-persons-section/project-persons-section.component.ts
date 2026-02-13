import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectDetailData, PersonPreviewItem } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';

@Component({
  selector: 'app-project-persons-section',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './project-persons-section.component.html',
  styleUrls: ['./project-persons-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonsSectionComponent {
  readonly ICONS = ICONS;

  readonly project = input.required<ProjectDetailData>();
  readonly openPersonsModal = output<'student' | 'teacher' | undefined>();

  readonly studentsPreview = computed(() =>
    (this.project().personsPreview ?? []).filter(p => p.type === 'student')
  );

  readonly teachersPreview = computed(() =>
    (this.project().personsPreview ?? []).filter(p => p.type === 'teacher')
  );

  readonly studentsCount = computed(() => this.project().studentsCount ?? 0);
  readonly teachersCount = computed(() => this.project().teachersCount ?? 0);
  readonly personsCount = computed(() => this.project().personsCount ?? 0);
  readonly studentsWithPhoto = computed(() => this.project().studentsWithPhotoCount ?? 0);
  readonly teachersWithPhoto = computed(() => this.project().teachersWithPhotoCount ?? 0);
  readonly studentsWithoutPhoto = computed(() => this.studentsCount() - this.studentsWithPhoto());
  readonly teachersWithoutPhoto = computed(() => this.teachersCount() - this.teachersWithPhoto());

  readonly hasPersons = computed(() => this.personsCount() > 0);

  readonly studentsOverflow = computed(() => Math.max(0, this.studentsCount() - 8));
  readonly teachersOverflow = computed(() => Math.max(0, this.teachersCount() - 8));

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
