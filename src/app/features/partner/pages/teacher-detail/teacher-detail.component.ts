import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherDetail, TeacherChangeLogEntry, TeacherPhoto, LinkedGroupPhoto } from '../../models/teacher.models';
import { ARCHIVE_SERVICE } from '../../models/archive.models';
import { ArchivePhotoUploadComponent } from '../../components/archive/archive-photo-upload/archive-photo-upload.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../../shared/components/media-lightbox';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsInputComponent } from '@shared/components/form';

@Component({
  selector: 'app-partner-teacher-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    PsInputComponent,
    ArchivePhotoUploadComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
  ],
  providers: [{ provide: ARCHIVE_SERVICE, useExisting: PartnerTeacherService }],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerTeacherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  teacherId = 0;
  teacher = signal<TeacherDetail | null>(null);
  changelog = signal<TeacherChangeLogEntry[]>([]);
  loading = signal(true);
  showPhotoUpload = signal(false);
  deletePhotoTarget = signal<TeacherPhoto | null>(null);

  // Csoport fotók
  groupPhotos = signal<LinkedGroupPhoto[]>([]);
  loadingGroupPhotos = signal(false);
  settingGroupPhoto = signal(false);

  // Inline alias edit
  newAlias = '';
  savingAlias = signal(false);

  // Profil szerkesztés
  editing = signal(false);
  saving = signal(false);
  editName = '';
  editTitlePrefix = '';
  editPosition = '';

  // Lightbox
  lightboxIndex = signal(-1);

  lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const t = this.teacher();
    if (!t) return [];
    return t.photos
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
    this.teacherId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTeacher();
    this.loadChangelog();
  }

  loadTeacher(): void {
    this.loading.set(true);
    this.teacherService.getTeacher(this.teacherId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.teacher.set(res.data);
          this.loading.set(false);
          if (res.data.linkedGroup) {
            this.loadGroupPhotos(res.data.linkedGroup);
          } else {
            this.groupPhotos.set([]);
          }
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['..'], { relativeTo: this.route });
        },
      });
  }

  loadChangelog(): void {
    this.teacherService.getChangelog(this.teacherId, { per_page: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.changelog.set(res.data) });
  }

  // === Profil szerkesztés ===

  startEditing(): void {
    const t = this.teacher();
    if (!t) return;
    this.editName = t.canonicalName;
    this.editTitlePrefix = t.titlePrefix ?? '';
    this.editPosition = t.position ?? '';
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  saveProfile(): void {
    const t = this.teacher();
    if (!t || this.saving()) return;

    const name = this.editName.trim();
    if (!name) return;

    this.saving.set(true);
    this.teacherService.updateTeacher(this.teacherId, {
      canonical_name: name,
      title_prefix: this.editTitlePrefix.trim() || null,
      position: this.editPosition.trim() || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.teacher.set(res.data);
          this.editing.set(false);
          this.saving.set(false);
          this.loadChangelog();
        },
        error: () => this.saving.set(false),
      });
  }

  // === Fotók ===

  setActivePhoto(photo: TeacherPhoto): void {
    if (photo.isActive) return;
    this.teacherService.setActivePhoto(this.teacherId, photo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadTeacher() });
  }

  confirmDeletePhoto(photo: TeacherPhoto): void {
    this.deletePhotoTarget.set(photo);
  }

  onDeletePhotoResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const photo = this.deletePhotoTarget();
      if (photo) {
        this.teacherService.deleteTeacherPhoto(this.teacherId, photo.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => this.loadTeacher() });
      }
    }
    this.deletePhotoTarget.set(null);
  }

  onPhotoUploaded(): void {
    this.showPhotoUpload.set(false);
    this.loadTeacher();
    this.loadChangelog();
  }

  openLightbox(photo: TeacherPhoto): void {
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
    const teacher = this.teacher();
    if (!alias || !teacher || this.savingAlias()) return;

    this.savingAlias.set(true);
    const aliases = [...teacher.aliases.map(a => a.aliasName), alias];

    this.teacherService.updateTeacher(this.teacherId, { aliases })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.teacher.set(res.data);
          this.newAlias = '';
          this.savingAlias.set(false);
        },
        error: () => this.savingAlias.set(false),
      });
  }

  removeAlias(aliasName: string): void {
    const teacher = this.teacher();
    if (!teacher) return;

    const aliases = teacher.aliases.map(a => a.aliasName).filter(a => a !== aliasName);

    this.teacherService.updateTeacher(this.teacherId, { aliases })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.teacher.set(res.data) });
  }

  getChangeLabel(type: string): string {
    const labels: Record<string, string> = {
      created: 'Létrehozva',
      name_changed: 'Név módosítva',
      title_changed: 'Titulus módosítva',
      position_changed: 'Pozíció módosítva',
      school_changed: 'Iskola módosítva',
      photo_uploaded: 'Fotó feltöltve',
      photo_deleted: 'Fotó törölve',
      active_photo_changed: 'Aktív fotó módosítva',
      group_photo_unified: 'Csoport fotó egységesítve',
    };
    return labels[type] ?? type;
  }

  // === Csoport fotók ===

  loadGroupPhotos(groupId: string): void {
    this.loadingGroupPhotos.set(true);
    this.teacherService.getLinkedGroupPhotos(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.groupPhotos.set(res.data);
          this.loadingGroupPhotos.set(false);
        },
        error: () => this.loadingGroupPhotos.set(false),
      });
  }

  setGroupActivePhoto(photo: LinkedGroupPhoto): void {
    const t = this.teacher();
    if (!t?.linkedGroup || this.settingGroupPhoto()) return;

    this.settingGroupPhoto.set(true);
    this.teacherService.setGroupActivePhoto(t.linkedGroup, photo.mediaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.settingGroupPhoto.set(false);
          this.loadTeacher();
        },
        error: () => this.settingGroupPhoto.set(false),
      });
  }

  isActiveGroupPhoto(photo: LinkedGroupPhoto): boolean {
    const t = this.teacher();
    if (!t) return false;
    return t.photos.some(p => p.mediaId === photo.mediaId && p.isActive);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
