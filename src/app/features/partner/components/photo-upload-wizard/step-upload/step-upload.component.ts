import { SlicePipe } from '@angular/common';
import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
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
  readonly photoClick = output<number>();

  /** Manuális toggle: a user "Elrejt"/"További képek" gombbal állítja */
  private readonly userWantsDropZone = signal(true);

  /** Drop zone látható: feltöltés közben MINDIG (progress miatt), egyébként user toggle */
  readonly showDropZone = computed(() =>
    this.uploading() || this.userWantsDropZone()
  );

  constructor() {
    // Feltöltés végén elrejtjük a drop zone-t (ha vannak már képek)
    effect(() => {
      const wasUploading = this.uploading();
      const hasPhotos = this.uploadedPhotos().length > 0;
      if (!wasUploading && hasPhotos) {
        this.userWantsDropZone.set(false);
      }
    });
  }

  onFilesSelected(files: File[]): void {
    this.filesSelected.emit(files);
  }

  toggleDropZone(): void {
    this.userWantsDropZone.update(v => !v);
  }
}
