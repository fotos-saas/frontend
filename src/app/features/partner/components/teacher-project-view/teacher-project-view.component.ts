import { Component, OnInit, inject, signal, computed, input, output, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import {
  TeacherProjectGroup,
  TeacherProjectSummary,
  TeacherInProject,
} from '../../models/teacher.models';
import { SchoolItem } from '../../models/partner.models';
import { SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component';
import { TeacherProjectCardComponent } from '../teacher-project-card/teacher-project-card.component';
import { TeacherPhotoUploadComponent } from '../teacher-photo-upload/teacher-photo-upload.component';
import { TeacherEditModalComponent } from '../teacher-edit-modal/teacher-edit-modal.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-teacher-project-view',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    SearchableSelectComponent,
    TeacherProjectCardComponent,
    TeacherPhotoUploadComponent,
    TeacherEditModalComponent,
    MediaLightboxComponent,
  ],
  templateUrl: './teacher-project-view.component.html',
  styleUrl: './teacher-project-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherProjectViewComponent implements OnInit {
  schools = input<SchoolItem[]>([]);
  classYears = input<SelectOption[]>([]);

  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  projects = signal<TeacherProjectGroup[]>([]);
  summary = signal<TeacherProjectSummary>({ totalProjects: 0, totalTeachers: 0, withPhoto: 0, missingPhoto: 0 });
  loading = signal(true);

  // Szűrők
  selectedSchool = signal('');
  selectedYear = signal('');
  missingOnly = signal(false);

  // Expand state
  expandedIds = signal<Set<number>>(new Set());

  // Upload modal
  uploadTarget = signal<TeacherInProject | null>(null);
  showCreateModal = signal(false);
  createForTeacher = signal<TeacherInProject | null>(null);

  // Lightbox
  lightboxMedia = signal<LightboxMediaItem[]>([]);

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({
      id: s.id,
      label: s.name,
      sublabel: s.city ?? undefined,
    }))
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const schoolId = this.selectedSchool();
    const classYear = this.selectedYear();

    this.teacherService.getTeachersByProject({
      class_year: classYear || undefined,
      school_id: schoolId ? parseInt(schoolId, 10) : undefined,
      missing_only: this.missingOnly(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projects.set(response.projects);
          this.summary.set(response.summary);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSchoolChange(value: string): void {
    this.selectedSchool.set(value);
    this.loadData();
  }

  onYearChange(value: string): void {
    this.selectedYear.set(value);
    this.loadData();
  }

  onMissingOnlyChange(): void {
    this.missingOnly.update(v => !v);
    this.loadData();
  }

  toggleProject(projectId: number): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  expandAll(): void {
    this.expandedIds.set(new Set(this.projects().map(p => p.id)));
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  isExpanded(projectId: number): boolean {
    return this.expandedIds().has(projectId);
  }

  onUploadPhoto(teacher: TeacherInProject): void {
    if (teacher.archiveId) {
      this.uploadTarget.set(teacher);
    } else {
      // Nincs archive rekord → create modal
      this.createForTeacher.set(teacher);
      this.showCreateModal.set(true);
    }
  }

  onViewPhoto(teacher: TeacherInProject): void {
    if (teacher.photoUrl) {
      this.lightboxMedia.set([{
        id: teacher.archiveId ?? teacher.personId ?? 0,
        url: teacher.photoUrl,
        fileName: teacher.personName,
      }]);
    }
  }

  closeUpload(): void {
    this.uploadTarget.set(null);
  }

  onPhotoUploaded(): void {
    this.uploadTarget.set(null);
    this.loadData();
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createForTeacher.set(null);
  }

  onTeacherCreated(): void {
    this.closeCreateModal();
    this.loadData();
  }
}
