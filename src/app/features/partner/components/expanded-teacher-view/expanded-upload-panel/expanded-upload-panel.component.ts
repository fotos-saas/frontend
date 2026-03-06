import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';
import { ExpandedUploadedPhoto } from '../expanded-teacher-view.types';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expanded-upload-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, ConfirmDialogComponent],
  templateUrl: './expanded-upload-panel.component.html',
  styleUrl: './expanded-upload-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedUploadPanelComponent {
  readonly ICONS = ICONS;
  readonly dataService = inject(ExpandedTeacherViewDataService);

  readonly syncRequested = output<void>();
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly photos = computed(() => this.dataService.uploadedPhotos());
  readonly collapsed = computed(() => this.dataService.uploadPanelCollapsed());
  readonly uploading = computed(() => this.dataService.uploading());
  readonly syncing = computed(() => this.dataService.syncing());
  readonly draggedPhoto = computed(() => this.dataService.draggedPhoto());
  readonly uploadProgress = computed(() => this.dataService.uploadProgress());
  readonly showDeleteAllConfirm = signal(false);

  readonly summaryText = computed(() => {
    const count = this.photos().length;
    return `${count} fotó feltöltve`;
  });

  isDragOver = false;

  toggleCollapse(): void {
    this.dataService.uploadPanelCollapsed.update(v => !v);
  }

  onFileSelect(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.dataService.uploadPhotos(Array.from(input.files));
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      const validFiles = Array.from(files).filter(f =>
        f.type === 'image/jpeg' || f.type === 'image/png'
      );
      if (validFiles.length > 0) {
        this.dataService.uploadPhotos(validFiles);
      }
    }
  }

  deletePhoto(photoId: number, event: Event): void {
    event.stopPropagation();
    this.dataService.deletePhoto(photoId);
  }

  onSync(): void {
    this.dataService.syncPhotos();
  }

  onDeleteAll(): void {
    this.showDeleteAllConfirm.set(true);
  }

  onDeleteAllResult(result: ConfirmDialogResult): void {
    this.showDeleteAllConfirm.set(false);
    if (result.action === 'confirm') {
      this.dataService.deleteAllPhotos();
    }
  }

  onPhotoDragStart(event: DragEvent, photo: ExpandedUploadedPhoto): void {
    event.dataTransfer?.setData('application/x-photo-id', String(photo.id));
    this.dataService.draggedPhoto.set(photo);
  }

  onPhotoDragEnd(): void {
    this.dataService.draggedPhoto.set(null);
  }
}
