import { Component, input, output, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerStudentService } from '../../services/partner-student.service';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-student-photo-upload',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './student-photo-upload.component.html',
  styleUrl: './student-photo-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPhotoUploadComponent {
  private readonly studentService = inject(PartnerStudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly studentId = input.required<number>();
  readonly close = output<void>();
  readonly uploaded = output<void>();

  readonly ICONS = ICONS;

  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);
  year = new Date().getFullYear();
  setActive = true;
  uploading = signal(false);
  errorMessage = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.previewUrl.set(URL.createObjectURL(this.selectedFile));
      this.errorMessage.set(null);
    }
  }

  upload(): void {
    if (!this.selectedFile || this.uploading()) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.studentService.uploadStudentPhoto(
      this.studentId(),
      this.selectedFile,
      this.year,
      this.setActive,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          if (res.success) {
            this.uploaded.emit();
          } else {
            this.errorMessage.set(res.message || 'Hiba történt a feltöltés során.');
          }
        },
        error: (err) => {
          this.uploading.set(false);
          this.errorMessage.set(err.error?.message || 'Hiba történt a feltöltés során.');
        },
      });
  }
}
