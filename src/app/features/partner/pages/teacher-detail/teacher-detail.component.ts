import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherDetail, TeacherChangeLogEntry, TeacherPhoto } from '../../models/teacher.models';
import { TeacherPhotoUploadComponent } from '../../components/teacher-photo-upload/teacher-photo-upload.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-partner-teacher-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    TeacherPhotoUploadComponent,
    ConfirmDialogComponent,
  ],
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

  // Inline alias edit
  newAlias = '';
  savingAlias = signal(false);

  // Profil szerkesztés
  editing = signal(false);
  saving = signal(false);
  editName = '';
  editTitlePrefix = '';
  editPosition = '';

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
    };
    return labels[type] ?? type;
  }
}
