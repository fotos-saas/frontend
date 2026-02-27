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
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { MediaLightboxComponent, LightboxMediaItem } from '@shared/components/media-lightbox';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import type { LinkedGroupPhoto } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-photo-chooser-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent, DatePipe, MediaLightboxComponent],
  templateUrl: './teacher-photo-chooser-dialog.component.html',
  styleUrl: './teacher-photo-chooser-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherPhotoChooserDialogComponent {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly photos = input.required<LinkedGroupPhoto[]>();
  readonly linkedGroup = input.required<string>();

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

    this.teacherService.setGroupActivePhoto(this.linkedGroup(), mediaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
