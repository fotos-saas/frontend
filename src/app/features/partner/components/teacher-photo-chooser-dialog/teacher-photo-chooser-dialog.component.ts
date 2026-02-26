import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import type { LinkedGroupPhoto } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-photo-chooser-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
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
  readonly selectedMediaId = signal<number | null>(null);

  readonly hasSelection = computed(() => this.selectedMediaId() !== null);

  readonly sortedPhotos = computed(() => {
    const items = this.photos();
    if (items.length > 0 && this.selectedMediaId() === null) {
      this.selectedMediaId.set(items[0].mediaId);
    }
    return items;
  });

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
