import { SlicePipe } from '@angular/common';
import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { UploadedPhoto } from '../../../services/partner.service';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';
import type { FileUploadProgress } from '../../../../../core/models/upload-progress.models';

/**
 * Step Upload - Drag & drop fájlfeltöltés + ZIP támogatás.
 * Használja a közös DropZoneComponent-et.
 */
@Component({
  selector: 'app-step-upload',
  standalone: true,
  imports: [LucideAngularModule, DropZoneComponent, SlicePipe],
  templateUrl: './step-upload.component.html',
  styleUrls: ['./step-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepUploadComponent {
  readonly ICONS = ICONS;

  readonly uploadedPhotos = input<UploadedPhoto[]>([]);
  readonly uploading = input<boolean>(false);
  readonly uploadProgress = input<FileUploadProgress | null>(null);

  readonly filesSelected = output<File[]>();
  readonly removePhoto = output<number>();
  readonly removeAllPhotos = output<void>();
  readonly continueToMatching = output<void>();

  showDropZone = signal(true);

  onFilesSelected(files: File[]): void {
    this.filesSelected.emit(files);
    this.showDropZone.set(false); // Elrejtjük a drop zone-t feltöltés után
  }

  toggleDropZone(): void {
    this.showDropZone.update(v => !v);
  }
}
