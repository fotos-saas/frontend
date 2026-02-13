import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerStudentService } from '../../services/partner-student.service';
import { StudentDetail, StudentChangeLogEntry, StudentPhoto } from '../../models/student.models';
import { StudentPhotoUploadComponent } from '../../components/student-photo-upload/student-photo-upload.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-partner-student-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    StudentPhotoUploadComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerStudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(PartnerStudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  studentId = 0;
  student = signal<StudentDetail | null>(null);
  changelog = signal<StudentChangeLogEntry[]>([]);
  loading = signal(true);
  showPhotoUpload = signal(false);
  deletePhotoTarget = signal<StudentPhoto | null>(null);

  // Inline alias edit
  newAlias = '';
  savingAlias = signal(false);

  // Profil szerkesztés
  editing = signal(false);
  saving = signal(false);
  editName = '';
  editClassName = '';

  // Lightbox
  lightboxIndex = signal(-1);

  lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const s = this.student();
    if (!s) return [];
    return s.photos
      .filter(p => p.url)
      .map(p => ({ id: p.id, url: p.url!, fileName: p.fileName ?? `Fotó ${p.year}` }));
  });

  // Changelog keresés
  changelogSearch = signal('');
  filteredChangelog = computed(() => {
    const search = this.changelogSearch().toLowerCase().trim();
    const entries = this.changelog();
    if (!search) return entries;
    return entries.filter(e =>
      this.getChangeLabel(e.changeType).toLowerCase().includes(search) ||
      (e.oldValue?.toLowerCase().includes(search)) ||
      (e.newValue?.toLowerCase().includes(search)) ||
      (e.userName?.toLowerCase().includes(search))
    );
  });

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStudent();
    this.loadChangelog();
  }

  loadStudent(): void {
    this.loading.set(true);
    this.studentService.getStudent(this.studentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.student.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['..'], { relativeTo: this.route });
        },
      });
  }

  loadChangelog(): void {
    this.studentService.getChangelog(this.studentId, { per_page: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.changelog.set(res.data) });
  }

  // === Profil szerkesztés ===

  startEditing(): void {
    const s = this.student();
    if (!s) return;
    this.editName = s.canonicalName;
    this.editClassName = s.className ?? '';
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  saveProfile(): void {
    const s = this.student();
    if (!s || this.saving()) return;

    const name = this.editName.trim();
    if (!name) return;

    this.saving.set(true);
    this.studentService.updateStudent(this.studentId, {
      canonical_name: name,
      class_name: this.editClassName.trim() || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.student.set(res.data);
          this.editing.set(false);
          this.saving.set(false);
          this.loadChangelog();
        },
        error: () => this.saving.set(false),
      });
  }

  // === Fotók ===

  setActivePhoto(photo: StudentPhoto): void {
    if (photo.isActive) return;
    this.studentService.setActivePhoto(this.studentId, photo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadStudent() });
  }

  confirmDeletePhoto(photo: StudentPhoto): void {
    this.deletePhotoTarget.set(photo);
  }

  onDeletePhotoResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const photo = this.deletePhotoTarget();
      if (photo) {
        this.studentService.deleteStudentPhoto(this.studentId, photo.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => this.loadStudent() });
      }
    }
    this.deletePhotoTarget.set(null);
  }

  onPhotoUploaded(): void {
    this.showPhotoUpload.set(false);
    this.loadStudent();
    this.loadChangelog();
  }

  openLightbox(photo: StudentPhoto): void {
    const media = this.lightboxMedia();
    const index = media.findIndex(m => m.id === photo.id);
    if (index >= 0) {
      this.lightboxIndex.set(index);
    }
  }

  onLightboxNavigate(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(-1);
  }

  // === Aliasok ===

  addAlias(): void {
    const alias = this.newAlias.trim();
    const student = this.student();
    if (!alias || !student || this.savingAlias()) return;

    this.savingAlias.set(true);
    const aliases = [...student.aliases.map(a => a.aliasName), alias];

    this.studentService.updateStudent(this.studentId, { aliases })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.student.set(res.data);
          this.newAlias = '';
          this.savingAlias.set(false);
        },
        error: () => this.savingAlias.set(false),
      });
  }

  removeAlias(aliasName: string): void {
    const student = this.student();
    if (!student) return;

    const aliases = student.aliases.map(a => a.aliasName).filter(a => a !== aliasName);

    this.studentService.updateStudent(this.studentId, { aliases })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.student.set(res.data) });
  }

  getChangeLabel(type: string): string {
    const labels: Record<string, string> = {
      created: 'Létrehozva',
      name_changed: 'Név módosítva',
      class_name_changed: 'Osztály módosítva',
      school_changed: 'Iskola módosítva',
      photo_uploaded: 'Fotó feltöltve',
      photo_deleted: 'Fotó törölve',
      active_photo_changed: 'Aktív fotó módosítva',
      no_photo_marked: 'Hiányzó jelölés',
      no_photo_unmarked: 'Jelölés visszavonva',
    };
    return labels[type] ?? type;
  }
}
