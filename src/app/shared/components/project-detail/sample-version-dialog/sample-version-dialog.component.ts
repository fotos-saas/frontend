import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { createBackdropHandler } from '../../../utils/dialog.util';
import { SampleVersion } from '../../../../features/partner/services/partner.service';
import { SampleVersionDialogFacade } from './sample-version-dialog-facade.service';
import { SamplesLightboxComponent } from '../../samples-lightbox/samples-lightbox.component';
import { SampleLightboxItem } from '../../samples-lightbox/samples-lightbox.types';

@Component({
  selector: 'app-sample-version-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, SamplesLightboxComponent],
  providers: [SampleVersionDialogFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-version-dialog.component.html',
  styleUrl: './sample-version-dialog.component.scss',
})
export class SampleVersionDialogComponent implements OnInit, OnDestroy {
  projectId = input.required<number>();
  packageId = input.required<number | null>();
  editVersion = input<SampleVersion | null>(null);
  close = output<void>();
  saved = output<void>();

  readonly facade = inject(SampleVersionDialogFacade);
  readonly ICONS = ICONS;

  isDragging = signal(false);
  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    const ver = this.editVersion();
    if (ver) {
      this.facade.initFromVersion(ver);
    }
  }

  ngOnDestroy(): void {
    this.facade.cleanup();
  }

  onFileSelected(event: Event): void {
    const el = event.target as HTMLInputElement;
    if (el.files?.length) {
      this.facade.addFiles(Array.from(el.files));
      el.value = '';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.facade.addFiles(Array.from(files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      event.preventDefault();
      this.facade.addFiles(imageFiles);
    }
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  get lightboxItems(): SampleLightboxItem[] {
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
  }

  get totalImageCount(): number {
    return this.facade.existingImages().length + this.facade.selectedFiles().length;
  }

  save(): void {
    this.facade.save(this.projectId(), this.packageId(), this.editVersion(), () => {
      this.saved.emit();
    });
  }
}
