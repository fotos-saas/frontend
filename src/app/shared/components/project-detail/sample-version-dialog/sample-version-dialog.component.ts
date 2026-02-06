import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { createBackdropHandler } from '../../../utils/dialog.util';
import { PartnerService, SampleVersion } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-sample-version-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-version-dialog.component.html',
  styleUrl: './sample-version-dialog.component.scss',
})
export class SampleVersionDialogComponent {
  projectId = input.required<number>();
  packageId = input.required<number>();
  editVersion = input<SampleVersion | null>(null);
  close = output<void>();
  saved = output<void>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  saving = signal(false);

  description = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragging = signal(false);

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    const ver = this.editVersion();
    if (ver) {
      this.description = ver.description;
      this.previewUrl = ver.imageUrl;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.setFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.setFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  private setFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.toast.error('Hiba', 'A kép maximum 10 MB lehet.');
      return;
    }
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = this.editVersion()?.imageUrl ?? null;
  }

  get isValid(): boolean {
    const hasImage = !!this.selectedFile || !!this.editVersion()?.imageUrl;
    return hasImage && !!this.description.trim();
  }

  save(): void {
    if (!this.isValid) return;

    this.saving.set(true);
    const formData = new FormData();
    formData.append('description', this.description.trim());
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const ver = this.editVersion();
    const obs = ver
      ? this.partnerService.updateSampleVersion(this.projectId(), this.packageId(), ver.id, formData)
      : this.partnerService.addSampleVersion(this.projectId(), this.packageId(), formData);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Siker', ver ? 'Verzió módosítva.' : 'Új verzió hozzáadva.');
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült a mentés.');
      },
    });
  }
}
