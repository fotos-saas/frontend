import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  linkedSignal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { MediaLightboxComponent, LightboxMediaItem } from '@shared/components/media-lightbox';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import type { LinkedGroupPhoto, PhotoChooserMode } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-photo-chooser-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent, DatePipe, MediaLightboxComponent, MatTooltipModule],
  templateUrl: './teacher-photo-chooser-dialog.component.html',
  styleUrl: './teacher-photo-chooser-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherPhotoChooserDialogComponent {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly photos = input.required<LinkedGroupPhoto[]>();
  readonly mode = input.required<PhotoChooserMode>();

  readonly closeEvent = output<void>();
  readonly savedEvent = output<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedMediaId = linkedSignal<LinkedGroupPhoto[], number | null>({
    source: this.photos,
    computation: (photos) => {
      const active = photos.find(p => p.isActive);
      return active ? active.mediaId : (photos.length > 0 ? photos[0].mediaId : null);
    },
  });

  readonly hasSelection = computed(() => this.selectedMediaId() !== null);

  readonly dialogTitle = computed(() =>
    this.mode().kind === 'linkedGroup'
      ? 'Egységes fotó választása'
      : 'Aktív fotó választása'
  );

  readonly dialogDescription = computed(() =>
    this.mode().kind === 'linkedGroup'
      ? 'Az összekapcsolt tanárnak több fotója van. Válaszd ki, melyik legyen az egységes fotó minden iskolánál.'
      : 'A tanárnak több fotója van. Válaszd ki, melyik legyen az aktív fotó.'
  );

  readonly submitButtonText = computed(() =>
    this.mode().kind === 'linkedGroup'
      ? 'Alkalmazás mindenkire'
      : 'Kiválasztott fotó beállítása'
  );

  readonly lightboxMedia = computed<LightboxMediaItem[]>(() =>
    this.photos()
      .filter(p => p.url)
      .map(p => ({ id: p.mediaId, url: p.url!, fileName: p.schoolName ?? p.teacherName }))
  );
  lightboxIndex = signal(-1);

  openLightbox(photo: LinkedGroupPhoto, event: MouseEvent): void {
    event.stopPropagation();
    const idx = this.lightboxMedia().findIndex(m => m.id === photo.mediaId);
    if (idx >= 0) this.lightboxIndex.set(idx);
  }

  selectPhoto(mediaId: number): void {
    this.selectedMediaId.set(mediaId);
  }

  isSelected(mediaId: number): boolean {
    return this.selectedMediaId() === mediaId;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    const mediaId = this.selectedMediaId();
    if (!mediaId || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const m = this.mode();
    const request$ = m.kind === 'linkedGroup'
      ? this.teacherService.setGroupActivePhoto(m.linkedGroup, mediaId)
      : this.teacherService.setActivePhotoByMedia(m.archiveId, mediaId);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.savedEvent.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Hiba a fotó beállítása során.');
      },
    });
  }

  onSkip(): void {
    this.closeEvent.emit();
  }
}
