import {
  Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { DropZoneComponent } from '@shared/components/drop-zone/drop-zone.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PartnerAlbumService } from '../../../../../services/partner-album.service';
import { PartnerProjectService } from '../../../../../services/partner-project.service';
import { PersonPhoto } from '../../../../../models/partner.models';
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
 * Személy fotó feltöltése / meglévő fotó kiválasztása a Layout Designerből.
 * Archív (minden projektben) vagy egyedi override (csak ezen a tablón).
 */
@Component({
  selector: 'app-layout-photo-upload-dialog',
  standalone: true,
  imports: [DialogWrapperComponent, DropZoneComponent, LucideAngularModule, ConfirmDialogComponent],
  templateUrl: './layout-photo-upload-dialog.component.html',
  styleUrls: ['./layout-photo-upload-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPhotoUploadDialogComponent implements OnInit {
  private readonly albumService = inject(PartnerAlbumService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  readonly person = input.required<PhotoUploadPerson>();
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly photoUploaded = output<PhotoUploadResult>();

  // Meglévő fotók
  readonly existingPhotos = signal<PersonPhoto[]>([]);
  readonly loadingPhotos = signal(false);
  readonly selectedExistingPhoto = signal<PersonPhoto | null>(null);
  readonly overridePhotoId = signal<number | null>(null);

  // Új feltöltés
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly uploadMode = signal<'archive' | 'override'>('override');
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Törlés megerősítés
  readonly showDeleteConfirm = signal(false);
  readonly photoToDelete = signal<PersonPhoto | null>(null);

  // Nézet mód: 'existing' (galéria) vagy 'upload' (drop zone)
  readonly viewMode = signal<'existing' | 'upload'>('existing');

  ngOnInit(): void {
    this.loadExistingPhotos();
  }

  private loadExistingPhotos(): void {
    this.loadingPhotos.set(true);
    this.albumService.getPersonPhotos(this.projectId(), this.person().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.existingPhotos.set(res.photos);
          this.overridePhotoId.set(res.overridePhotoId);
          // Ha nincs meglévő fotó, rögtön upload nézet
          if (res.photos.length === 0) {
            this.viewMode.set('upload');
          }
          this.loadingPhotos.set(false);
        },
        error: () => {
          this.loadingPhotos.set(false);
          this.viewMode.set('upload');
        },
      });
  }

  selectExistingPhoto(photo: PersonPhoto): void {
    this.selectedExistingPhoto.set(
      this.selectedExistingPhoto()?.id === photo.id ? null : photo,
    );
  }

  async confirmSelectExisting(): Promise<void> {
    const photo = this.selectedExistingPhoto();
    if (!photo) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await firstValueFrom(
        this.projectService.overridePersonPhoto(this.projectId(), this.person().id, photo.mediaId),
      );

      if (result.success && result.data) {
        this.photoUploaded.emit({
          personId: this.person().id,
          photoUrl: result.data.photoUrl || photo.url,
          thumbUrl: result.data.photoThumbUrl || photo.thumbUrl,
          mediaId: photo.mediaId,
          isOverride: true,
        });
      }
    } catch {
      this.errorMessage.set('Nem sikerült a fotó beállítása.');
    }

    this.uploading.set(false);
  }

  requestDeletePhoto(photo: PersonPhoto, event: MouseEvent): void {
    event.stopPropagation();
    this.photoToDelete.set(photo);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmResult(result: { action: 'confirm' | 'cancel' }): void {
    this.showDeleteConfirm.set(false);
    if (result.action === 'confirm') {
      this.deletePhoto();
    } else {
      this.photoToDelete.set(null);
    }
  }

  private async deletePhoto(): Promise<void> {
    const photo = this.photoToDelete();
    if (!photo) return;

    try {
      await firstValueFrom(
        this.albumService.deletePersonPhoto(this.projectId(), this.person().id, photo.id),
      );
      this.existingPhotos.update(photos => photos.filter(p => p.id !== photo.id));
      if (this.selectedExistingPhoto()?.id === photo.id) {
        this.selectedExistingPhoto.set(null);
      }
      if (this.existingPhotos().length === 0) {
        this.viewMode.set('upload');
      }
    } catch {
      this.errorMessage.set('Nem sikerült a fotó törlése.');
    }
    this.photoToDelete.set(null);
  }

  switchToUpload(): void {
    this.selectedExistingPhoto.set(null);
    this.viewMode.set('upload');
  }

  switchToExisting(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.viewMode.set('existing');
  }

  onFilesSelected(files: File[]): void {
    if (files.length === 0) return;
    const file = files[0];
    this.selectedFile.set(file);
    this.errorMessage.set(null);

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
      let photoUrl = thumbUrl;
      let isOverride = false;

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
