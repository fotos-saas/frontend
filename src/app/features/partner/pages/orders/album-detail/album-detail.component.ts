import { Component, inject, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import {
  PartnerOrdersService,
  AlbumPhoto
} from '../../../services/partner-orders.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';
import { SelectionGridComponent } from '../../../../photo-selection/components/selection-grid/selection-grid.component';
import { MediaLightboxComponent } from '../../../../../shared/components/media-lightbox/media-lightbox.component';
import { WorkflowPhoto } from '../../../../photo-selection/models/workflow.models';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';
import { AlbumDetailState } from './album-detail.state';
import { AlbumHeaderComponent } from './components/album-header/album-header.component';
import { AlbumInfoBarComponent } from './components/album-info-bar/album-info-bar.component';
import { AlbumPhotoListComponent } from './components/album-photo-list/album-photo-list.component';
import { AlbumEditModalComponent, AlbumEditFormData } from './components/album-edit-modal/album-edit-modal.component';

/**
 * Album Detail Component
 *
 * Partner album részletes nézete.
 * State management: AlbumDetailState class (Signal-based)
 */
@Component({
  selector: 'app-partner-album-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    MatTooltipModule,
    ConfirmDialogComponent,
    DropZoneComponent,
    SelectionGridComponent,
    MediaLightboxComponent,
    AlbumHeaderComponent,
    AlbumInfoBarComponent,
    AlbumPhotoListComponent,
    AlbumEditModalComponent
  ],
  templateUrl: './album-detail.component.html',
  styleUrl: './album-detail.component.scss'
})
export class PartnerAlbumDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(PartnerOrdersService);
  private readonly toast = inject(ToastService);

  readonly ICONS = ICONS;
  readonly state = new AlbumDetailState();

  // Backdrop handler az edit modalhoz
  readonly editBackdropHandler = createBackdropHandler(() => this.state.closeEditModal());

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    if (!id || isNaN(id) || id < 1) {
      this.router.navigate(['/partner/orders/clients']);
      return;
    }
    this.loadAlbum(id);
  }

  // === ALBUM LOADING ===

  private loadAlbum(id: number): void {
    this.state.startLoading();
    this.ordersService.getAlbum(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (album) => {
        this.state.finishLoading(album);
      },
      error: () => {
        this.toast.error('Hiba', 'Az album nem található');
        this.router.navigate(['/partner/orders/clients']);
      }
    });
  }

  // === HEADER EVENTS ===

  onActivate(): void {
    this.state.activating.set(true);
    this.ordersService.activateAlbum(this.state.album()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album aktiválva! Az ügyfél mostantól elérheti.');
        this.loadAlbum(this.state.album()!.id);
        this.state.activating.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.activating.set(false);
      }
    });
  }

  onEditClick(): void {
    this.state.openEditModal();
  }

  onDeleteClick(): void {
    this.state.openDeleteAlbumConfirm();
  }

  // === DELETE ALBUM ===

  onDeleteAlbumResult(result: ConfirmDialogResult): void {
    this.state.closeDeleteAlbumConfirm();
    if (result.action === 'confirm') {
      this.deleteAlbum();
    }
  }

  private deleteAlbum(): void {
    const clientId = this.state.album()!.client.id;
    this.ordersService.deleteAlbum(this.state.album()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album törölve');
        this.router.navigate(['/partner/orders/clients', clientId]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
      }
    });
  }

  // === UPLOAD ===

  onFilesSelected(files: File[]): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/zip', 'application/x-zip-compressed'];
    const validFiles = files.filter(f => {
      const isValidType = validTypes.includes(f.type) || f.name.toLowerCase().endsWith('.zip');
      const isValidSize = f.size <= 50 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      this.toast.error('Hiba', 'Nincs érvényes fájl a feltöltéshez');
      return;
    }

    if (validFiles.length !== files.length) {
      this.toast.warning('Figyelem', `${files.length - validFiles.length} fájl nem megfelelő formátumú vagy túl nagy`);
    }

    this.state.startUpload(validFiles.length);

    this.ordersService.uploadPhotosChunked(this.state.album()!.id, validFiles).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (progress) => {
        this.state.updateUploadProgress(progress);
        if (progress.completed) {
          this.toast.success('Siker', `${progress.uploadedCount} kép sikeresen feltöltve`);
          this.loadAlbum(this.state.album()!.id);
          this.state.uploadSuccess();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt a feltöltés során');
        this.state.uploadError();
      }
    });
  }

  // === GRID EVENTS ===

  onZoomClick(event: { photo: WorkflowPhoto; index: number }): void {
    this.state.openLightbox(event.index);
  }

  onDeleteSelect(event: { photo: WorkflowPhoto; selected: boolean }): void {
    this.state.toggleDeleteSelection(event.photo.id);
  }

  onSingleDeleteClick(photo: WorkflowPhoto): void {
    const albumPhoto = this.state.album()?.photos.find(p => p.id === photo.id);
    if (albumPhoto) {
      this.state.confirmDeletePhoto(albumPhoto);
    }
  }

  // === LIST EVENTS ===

  onListZoomClick(photo: AlbumPhoto): void {
    this.state.openLightboxAtPhoto(photo.id);
  }

  onListDeleteClick(photo: AlbumPhoto): void {
    this.state.confirmDeletePhoto(photo);
  }

  onListItemClick(event: { photo: AlbumPhoto; event: MouseEvent }): void {
    if ((event.event.ctrlKey || event.event.metaKey) && this.state.album()!.status !== 'completed') {
      this.state.toggleDeleteSelection(event.photo.id);
    }
  }

  // === DELETE PHOTO ===

  onDeletePhotoResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deletePhoto();
    } else {
      this.state.closeDeletePhotoConfirm();
    }
  }

  private deletePhoto(): void {
    const photo = this.state.photoToDelete();
    if (!photo) return;

    this.ordersService.deletePhoto(this.state.album()!.id, photo.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.state.removePhoto(photo.id);
        this.toast.success('Siker', 'Kép törölve');
        this.state.closeDeletePhotoConfirm();
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.closeDeletePhotoConfirm();
      }
    });
  }

  // === DELETE MULTIPLE PHOTOS ===

  onConfirmDeletePhotos(): void {
    this.state.openDeletePhotosConfirm();
  }

  onDeletePhotosResult(result: ConfirmDialogResult): void {
    this.state.closeDeletePhotosConfirm();
    if (result.action === 'confirm') {
      this.deleteSelectedPhotos();
    }
  }

  private deleteSelectedPhotos(): void {
    const idsToDelete = this.state.deleteSelectedIds();
    if (idsToDelete.length === 0) return;

    this.state.deletingPhotos.set(true);

    const deletePromises = idsToDelete.map(id =>
      this.ordersService.deletePhoto(this.state.album()!.id, id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.state.removePhotos(idsToDelete);
        this.toast.success('Siker', `${idsToDelete.length} kép törölve`);
      })
      .catch(() => {
        this.toast.error('Hiba', 'Nem sikerült törölni néhány képet');
        this.state.deletingPhotos.set(false);
        this.loadAlbum(this.state.album()!.id);
      });
  }

  // === EDIT MODAL ===

  onSaveAlbum(formData: AlbumEditFormData): void {
    if (!formData.name.trim()) {
      this.toast.error('Hiba', 'Az album neve kötelező');
      return;
    }

    this.state.saving.set(true);
    this.ordersService.updateAlbum(this.state.album()!.id, {
      name: formData.name.trim(),
      min_selections: formData.minSelections,
      max_selections: formData.maxSelections,
      max_retouch_photos: formData.maxRetouchPhotos,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album mentve');
        this.loadAlbum(this.state.album()!.id);
        this.state.editSuccess();
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Nem sikerült menteni');
        this.state.saving.set(false);
      }
    });
  }

  // === EXPIRY ===

  onExpiryChange(dateString: string): void {
    const newExpiry = new Date(dateString);
    newExpiry.setHours(23, 59, 59, 999);

    this.state.extendingExpiry.set(true);
    this.ordersService.extendAlbumExpiry(this.state.album()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateExpiry(response.data.expiresAt);
        this.toast.success('Siker', 'Lejárat módosítva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.extendingExpiry.set(false);
      }
    });
  }

  onExtendExpiry(days: number): void {
    const currentExpiry = this.state.album()?.expiresAt;
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    const startDate = baseDate < new Date() ? new Date() : baseDate;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    this.state.extendingExpiry.set(true);
    this.ordersService.extendAlbumExpiry(this.state.album()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateExpiry(response.data.expiresAt);
        this.toast.success('Siker', `Lejárat meghosszabbítva ${days} nappal`);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.extendingExpiry.set(false);
      }
    });
  }

  // === LIGHTBOX ===

  onNavigateLightbox(direction: number): void {
    this.state.navigateLightbox(direction);
  }

  // === EXPORT ===

  onDownloadZip(): void {
    const photoIds = this.state.selectedPhotoIds();
    if (photoIds.length === 0) {
      this.toast.warning('Figyelem', 'Nincs kiválasztott kép');
      return;
    }

    this.state.downloading.set(true);
    this.ordersService.downloadSelectedZip(this.state.album()!.id, photoIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.triggerDownload(blob, `album-${this.state.album()!.id}-selected.zip`);
          this.state.downloading.set(false);
          this.toast.success('Siker', 'Letöltés elkezdődött');
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült a letöltés');
          this.state.downloading.set(false);
        }
      });
  }

  onExportExcel(): void {
    const photoIds = this.state.selectedPhotoIds();
    const idsToExport = photoIds.length > 0 ? photoIds : this.state.album()!.photos.map(p => p.id);

    this.state.exporting.set(true);
    this.ordersService.exportExcel(this.state.album()!.id, idsToExport)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.triggerDownload(blob, `album-${this.state.album()!.id}-export.xlsx`);
          this.state.exporting.set(false);
          this.toast.success('Siker', 'Excel export elkészült');
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült az export');
          this.state.exporting.set(false);
        }
      });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
