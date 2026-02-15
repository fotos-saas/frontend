import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, DestroyRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PsTextareaComponent, PsFileUploadComponent } from '@shared/components/form';
import { SampleVersion } from '../../../../features/partner/services/partner.service';
import { SampleVersionDialogFacade } from './sample-version-dialog-facade.service';
import { SamplesLightboxComponent } from '../../samples-lightbox/samples-lightbox.component';
import { SampleLightboxItem } from '../../samples-lightbox/samples-lightbox.types';

@Component({
  selector: 'app-sample-version-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, SamplesLightboxComponent, PsTextareaComponent, PsFileUploadComponent, DialogWrapperComponent],
  providers: [SampleVersionDialogFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-version-dialog.component.html',
  styleUrl: './sample-version-dialog.component.scss',
})
export class SampleVersionDialogComponent implements OnInit {
  projectId = input.required<number>();
  packageId = input.required<number | null>();
  editVersion = input<SampleVersion | null>(null);
  close = output<void>();
  saved = output<void>();

  readonly facade = inject(SampleVersionDialogFacade);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  constructor() {
    this.destroyRef.onDestroy(() => this.facade.cleanup());
  }

  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

  ngOnInit(): void {
    const ver = this.editVersion();
    if (ver) {
      this.facade.initFromVersion(ver);
    }
  }

  onFilesChange(files: File[]): void {
    this.facade.setFiles(files);
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  readonly lightboxItems = computed(() => {
    const existing = this.facade.existingImages().map((img, i) => ({
      id: img.id,
      url: img.url,
      thumbUrl: img.thumbUrl,
      fileName: `Kép ${i + 1}`,
      createdAt: this.editVersion()?.createdAt ?? new Date().toISOString(),
    }));
    const newOnes = this.facade.previewUrls().map((url, i) => ({
      id: -(i + 1),
      url,
      fileName: this.facade.selectedFiles()[i]?.name ?? `Új kép ${i + 1}`,
      createdAt: new Date().toISOString(),
    }));
    return [...existing, ...newOnes];
  });

  readonly totalImageCount = computed(() =>
    this.facade.existingImages().length + this.facade.selectedFiles().length
  );

  save(): void {
    this.facade.save(this.projectId(), this.packageId(), this.editVersion(), () => {
      this.saved.emit();
    });
  }
}
