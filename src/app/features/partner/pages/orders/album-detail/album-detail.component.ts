import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { AlbumPhoto } from '../../../services/partner-orders.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';
import { SelectionGridComponent } from '../../../../photo-selection/components/selection-grid/selection-grid.component';
import { MediaLightboxComponent } from '../../../../../shared/components/media-lightbox/media-lightbox.component';
import { WorkflowPhoto } from '../../../../photo-selection/models/workflow.models';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';
import { AlbumDetailState } from './album-detail.state';
import { AlbumDetailActionsService } from './album-detail-actions.service';
import { AlbumHeaderComponent } from './components/album-header/album-header.component';
import { AlbumInfoBarComponent } from './components/album-info-bar/album-info-bar.component';
import { AlbumPhotoListComponent } from './components/album-photo-list/album-photo-list.component';
import { AlbumEditModalComponent, AlbumEditFormData } from './components/album-edit-modal/album-edit-modal.component';

/**
 * Album Detail Component
 *
 * Partner album részletes nézete.
 * State management: AlbumDetailState class (Signal-based)
 * HTTP műveletek: AlbumDetailActionsService (component-scoped)
 */
@Component({
  selector: 'app-partner-album-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    AlbumEditModalComponent,
  ],
  providers: [AlbumDetailActionsService],
  templateUrl: './album-detail.component.html',
  styleUrl: './album-detail.component.scss'
})
export class PartnerAlbumDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly actions = inject(AlbumDetailActionsService);

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
    this.actions.loadAlbum(this.state, id);
    this.actions.loadWebshopStatus(this.state, id);
  }

  // === HEADER EVENTS ===

  onActivate(): void {
    this.actions.activateAlbum(this.state);
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
      this.actions.deleteAlbum(this.state);
    }
  }

  // === UPLOAD ===

  onFilesSelected(files: File[]): void {
    this.actions.uploadFiles(this.state, files);
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
      this.actions.deletePhoto(this.state);
    } else {
      this.state.closeDeletePhotoConfirm();
    }
  }

  // === DELETE MULTIPLE PHOTOS ===

  onConfirmDeletePhotos(): void {
    this.state.openDeletePhotosConfirm();
  }

  onDeletePhotosResult(result: ConfirmDialogResult): void {
    this.state.closeDeletePhotosConfirm();
    if (result.action === 'confirm') {
      this.actions.deleteSelectedPhotos(this.state);
    }
  }

  // === EDIT MODAL ===

  onSaveAlbum(formData: AlbumEditFormData): void {
    this.actions.saveAlbum(this.state, formData);
  }

  // === EXPIRY ===

  onExpiryChange(dateString: string): void {
    this.actions.changeExpiry(this.state, dateString);
  }

  onExtendExpiry(days: number): void {
    this.actions.extendExpiry(this.state, days);
  }

  // === LIGHTBOX ===

  onNavigateLightbox(direction: number): void {
    this.state.navigateLightbox(direction);
  }

  // === WEBSHOP ===

  onGenerateWebshopToken(): void {
    const album = this.state.album();
    if (album) {
      this.actions.generateWebshopToken(this.state, album.id);
    }
  }

  onCopyWebshopLink(): void {
    this.actions.copyWebshopLink(this.state);
  }

  // === EXPORT ===

  onDownloadZip(): void {
    this.actions.downloadZip(this.state);
  }

  onExportExcel(): void {
    this.actions.exportExcel(this.state);
  }
}
