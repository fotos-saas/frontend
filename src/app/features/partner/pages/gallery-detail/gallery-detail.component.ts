import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropZoneComponent } from '../../../../shared/components/drop-zone/drop-zone.component';
import { SelectionGridComponent } from '../../../photo-selection/components/selection-grid/selection-grid.component';
import { MediaLightboxComponent } from '../../../../shared/components/media-lightbox/media-lightbox.component';
import { WorkflowPhoto } from '../../../photo-selection/models/workflow.models';
import { GalleryPhoto } from '../../models/gallery.models';
import { GalleryDetailState } from './gallery-detail.state';
import { GalleryDetailActionsService } from './gallery-detail-actions.service';
import { GalleryHeaderComponent } from './components/gallery-header/gallery-header.component';
import { GalleryInfoBarComponent } from './components/gallery-info-bar/gallery-info-bar.component';
import { GalleryPhotoListComponent } from './components/gallery-photo-list/gallery-photo-list.component';

@Component({
  selector: 'app-gallery-detail',
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
    GalleryHeaderComponent,
    GalleryInfoBarComponent,
    GalleryPhotoListComponent,
  ],
  providers: [GalleryDetailActionsService],
  templateUrl: './gallery-detail.component.html',
  styleUrl: './gallery-detail.component.scss',
})
export class GalleryDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly actions = inject(GalleryDetailActionsService);

  readonly ICONS = ICONS;
  readonly state = new GalleryDetailState();
  private projectId = 0;

  ngOnInit(): void {
    this.projectId = +this.route.snapshot.params['id'];
    if (!this.projectId || isNaN(this.projectId) || this.projectId < 1) {
      this.router.navigate(['/partner/projects']);
      return;
    }
    this.actions.loadGallery(this.state, this.projectId);
  }

  // === UPLOAD ===

  onFilesSelected(files: File[]): void {
    this.actions.uploadFiles(this.state, this.projectId, files);
  }

  // === GRID EVENTS ===

  onZoomClick(event: { photo: WorkflowPhoto; index: number }): void {
    this.state.openLightbox(event.index);
  }

  onDeleteSelect(event: { photo: WorkflowPhoto; selected: boolean }): void {
    this.state.toggleDeleteSelection(event.photo.id);
  }

  onSingleDeleteClick(photo: WorkflowPhoto): void {
    const galleryPhoto = this.state.gallery()?.photos.find(p => p.id === photo.id);
    if (galleryPhoto) {
      this.state.confirmDeletePhoto(galleryPhoto);
    }
  }

  // === LIST EVENTS ===

  onListZoomClick(photo: GalleryPhoto): void {
    this.state.openLightboxAtPhoto(photo.id);
  }

  onListDeleteClick(photo: GalleryPhoto): void {
    this.state.confirmDeletePhoto(photo);
  }

  onListItemClick(event: { photo: GalleryPhoto; event: MouseEvent }): void {
    if (event.event.ctrlKey || event.event.metaKey) {
      this.state.toggleDeleteSelection(event.photo.id);
    }
  }

  // === DELETE PHOTO ===

  onDeletePhotoResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.actions.deletePhoto(this.state, this.projectId);
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
      this.actions.deleteSelectedPhotos(this.state, this.projectId);
    }
  }

  // === LIGHTBOX ===

  onNavigateLightbox(direction: number): void {
    this.state.navigateLightbox(direction);
  }

  // === NAVIGATION ===

  onBack(): void {
    this.router.navigate(['/partner/projects', this.projectId]);
  }
}
