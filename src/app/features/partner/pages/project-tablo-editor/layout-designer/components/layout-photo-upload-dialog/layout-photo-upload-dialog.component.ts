import {
  Component, ChangeDetectionStrategy, input, output, signal, inject,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { DropZoneComponent } from '@shared/components/drop-zone/drop-zone.component';
import { PartnerAlbumService } from '../../../../../services/partner-album.service';
import { PartnerProjectService } from '../../../../../services/partner-project.service';
import { firstValueFrom } from 'rxjs';

export interface PhotoUploadPerson {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  archiveId: number | null;
}

export interface PhotoUploadResult {
  personId: number;
  photoUrl: string;
  thumbUrl: string;
  mediaId: number;
  isOverride: boolean;
}

/**
 * Egyetlen személy fotó feltöltése a Layout Designerből.
 * Archív (minden projektben) vagy egyedi override (csak ezen a tablón).
 */
@Component({
  selector: 'app-layout-photo-upload-dialog',
  standalone: true,
  imports: [DialogWrapperComponent, DropZoneComponent, LucideAngularModule],
  templateUrl: './layout-photo-upload-dialog.component.html',
  styleUrls: ['./layout-photo-upload-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPhotoUploadDialogComponent {
  private readonly albumService = inject(PartnerAlbumService);
  private readonly projectService = inject(PartnerProjectService);
  protected readonly ICONS = ICONS;

  readonly person = input.required<PhotoUploadPerson>();
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly photoUploaded = output<PhotoUploadResult>();

  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly uploadMode = signal<'archive' | 'override'>('override');
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onFilesSelected(files: File[]): void {
    if (files.length === 0) return;
    const file = files[0];
    this.selectedFile.set(file);
    this.errorMessage.set(null);

    // Előnézet generálás
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  async upload(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    try {
      // 1. Feltöltés az archívba (minden esetben kell media rekord)
      const uploadResult = await firstValueFrom(
        this.albumService.uploadPersonPhoto(this.projectId(), this.person().id, file),
      );

      if (!uploadResult.success) {
        this.errorMessage.set('Feltöltés sikertelen.');
        this.uploading.set(false);
        return;
      }

      const mediaId = uploadResult.photo.mediaId;
      const thumbUrl = uploadResult.photo.thumbUrl;
      let photoUrl = thumbUrl; // Alapértelmezettként a thumb URL-t használjuk
      let isOverride = false;

      // 2. Ha override mód, beállítjuk a projekt-specifikus override-ot
      if (this.uploadMode() === 'override') {
        const overrideResult = await firstValueFrom(
          this.projectService.overridePersonPhoto(this.projectId(), this.person().id, mediaId),
        );

        if (overrideResult.success && overrideResult.data) {
          photoUrl = overrideResult.data.photoUrl || thumbUrl;
          isOverride = true;
        }
      }

      this.photoUploaded.emit({
        personId: this.person().id,
        photoUrl,
        thumbUrl,
        mediaId,
        isOverride,
      });
    } catch {
      this.errorMessage.set('Váratlan hiba a feltöltés során.');
    }

    this.uploading.set(false);
  }
}
