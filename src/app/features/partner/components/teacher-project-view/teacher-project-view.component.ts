import { Component, OnInit, inject, signal, computed, input, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import {
  TeacherSchoolGroup,
  TeacherSchoolSummary,
  TeacherInSchool,
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

  schoolGroups = signal<TeacherSchoolGroup[]>([]);
  summary = signal<TeacherSchoolSummary>({ totalSchools: 0, totalTeachers: 0, withPhoto: 0, missingPhoto: 0 });
  loading = signal(true);
  initialized = signal(false);

  // Szűrők
  selectedSchool = signal('');
  selectedYear = signal('');
  missingOnly = signal(false);

  // Expand state
  expandedIds = signal<Set<number>>(new Set());

  // Upload modal
  uploadTarget = signal<TeacherInSchool | null>(null);
  showCreateModal = signal(false);
  createForTeacher = signal<TeacherInSchool | null>(null);

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
    // Legfrissebb év auto-select: várjuk meg a classYears-t
    this.waitForYearsAndLoad();
  }

  private waitForYearsAndLoad(): void {
    // Ha classYears már betöltött (parent-ből jön input-ként)
    const checkAndLoad = (): void => {
      const years = this.classYears();
      if (years.length > 0 && !this.initialized()) {
        // Legfrissebb év kiválasztása (első elem, mert DESC rendezve jön)
        this.selectedYear.set(String(years[0].id));
        this.initialized.set(true);
        this.loadData();
      } else if (!this.initialized()) {
        // Még nincs adat, próbáljuk újra rövid késleltetéssel
        setTimeout(() => checkAndLoad(), 100);
      }
    };
    checkAndLoad();
  }

  loadData(): void {
    this.loading.set(true);
    const schoolId = this.selectedSchool();
    const classYear = this.selectedYear();

    this.teacherService.getTeachersBySchool({
      class_year: classYear || undefined,
      school_id: schoolId ? parseInt(schoolId, 10) : undefined,
      missing_only: this.missingOnly(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schoolGroups.set(response.schools);
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

  toggleSchool(schoolId: number): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(schoolId)) {
        next.delete(schoolId);
      } else {
        next.add(schoolId);
      }
      return next;
    });
  }

  expandAll(): void {
    this.expandedIds.set(new Set(this.schoolGroups().map(s => s.schoolId)));
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  isExpanded(schoolId: number): boolean {
    return this.expandedIds().has(schoolId);
  }

  onUploadPhoto(teacher: TeacherInSchool): void {
    if (teacher.archiveId) {
      this.uploadTarget.set(teacher);
    } else {
      this.createForTeacher.set(teacher);
      this.showCreateModal.set(true);
    }
  }

  onViewPhoto(teacher: TeacherInSchool): void {
    if (teacher.photoUrl) {
      this.lightboxMedia.set([{
        id: teacher.archiveId,
        url: teacher.photoUrl,
        fileName: teacher.name,
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
