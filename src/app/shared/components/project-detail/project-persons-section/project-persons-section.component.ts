import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '../../../../core/services/toast.service';
import { ProjectDetailData, PersonPreviewItem } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';

interface PersonListItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
}

@Component({
  selector: 'app-project-persons-section',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './project-persons-section.component.html',
  styleUrls: ['./project-persons-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonsSectionComponent {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  readonly ICONS = ICONS;

  readonly project = input.required<ProjectDetailData>();
  /** API URL a személyek lekéréséhez. Ha nincs megadva, a másolás gomb rejtett. */
  readonly personsApiUrl = input<string | null>(null);

  readonly openPersonsModal = output<'student' | 'teacher' | undefined>();
  readonly openUploadWizard = output<'students' | 'teachers'>();
  readonly downloadPendingZip = output<void>();
  readonly addPersons = output<'student' | 'teacher'>();

  /** ID megjelenítés toggle */
  readonly withId = signal(false);
  /** Másolás folyamatban */
  readonly copying = signal(false);
  /** Sikeres másolás visszajelzés */
  readonly copied = signal(false);

  readonly isPreliminary = computed(() => this.project().isPreliminary ?? false);
  readonly pendingStudentPhotos = computed(() => this.project().pendingStudentPhotos ?? 0);
  readonly pendingTeacherPhotos = computed(() => this.project().pendingTeacherPhotos ?? 0);
  readonly totalPendingPhotos = computed(() => this.pendingStudentPhotos() + this.pendingTeacherPhotos());

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
  readonly extraStudents = computed(() => this.project().extraNames?.students ?? '');
  readonly extraTeachers = computed(() => this.project().extraNames?.teachers ?? '');

  readonly studentsOverflow = computed(() => Math.max(0, this.studentsCount() - 8));
  readonly teachersOverflow = computed(() => Math.max(0, this.teachersCount() - 8));

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  toggleWithId(event: MouseEvent): void {
    event.stopPropagation();
    this.withId.update(v => !v);
  }

  copyNames(event: MouseEvent): void {
    event.stopPropagation();
    const url = this.personsApiUrl();
    if (!url || this.copying()) return;

    this.copying.set(true);
    this.copied.set(false);

    this.http.get<{ data: PersonListItem[] }>(url).subscribe({
      next: (res) => {
        const students = res.data.filter(p => p.type === 'student');
        const teachers = res.data.filter(p => p.type === 'teacher');
        const includeId = this.withId();

        const lines: string[] = [];
        if (students.length > 0) {
          lines.push(`Diákok (${students.length}):`);
          students.forEach(p => {
            lines.push(includeId ? `#${p.id} ${p.name}` : p.name);
          });
        }
        if (teachers.length > 0) {
          if (lines.length > 0) lines.push('');
          lines.push(`Tanárok (${teachers.length}):`);
          teachers.forEach(p => {
            lines.push(includeId ? `#${p.id} ${p.name}` : p.name);
          });
        }

        const text = lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
          this.toastService.success(
            'Névsor másolva!',
            `${students.length} diák + ${teachers.length} tanár a vágólapon`,
          );
          this.copying.set(false);
          this.copied.set(true);
          setTimeout(() => this.copied.set(false), 2000);
        }).catch(() => {
          this.toastService.error('Hiba', 'Nem sikerült a vágólapra másolni');
          this.copying.set(false);
        });
      },
      error: () => {
        this.copying.set(false);
      },
    });
  }
}
