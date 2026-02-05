import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SelectionGridComponent } from '../../../photo-selection/components/selection-grid/selection-grid.component';
import { WorkflowPhoto } from '../../../photo-selection/models/workflow.models';
import { MediaLightboxComponent } from '../../../../shared/components/media-lightbox/media-lightbox.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StickyFooterComponent } from '../../../../shared/components/sticky-footer/sticky-footer.component';
import { FloatingInfoComponent } from '../../components/floating-info/floating-info.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { AlbumDetailStateService } from './album-detail-state.service';

/**
 * Client Album Detail - Album részletek fotó kiválasztási funkcióval
 *
 * Használja a meglévő SelectionGridComponent-et a fotók megjelenítéséhez.
 * Az üzleti logika az AlbumDetailStateService-ben van.
 */
@Component({
  selector: 'app-client-album-detail',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    SelectionGridComponent,
    MediaLightboxComponent,
    ConfirmDialogComponent,
    StickyFooterComponent,
    FloatingInfoComponent,
  ],
  providers: [AlbumDetailStateService],
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAlbumDetailComponent implements OnInit {
  private state = inject(AlbumDetailStateService);
  protected readonly ICONS = ICONS;

  // --- Template-facing signal delegálások ---
  readonly album = this.state.album;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly saving = this.state.saving;
  readonly hasMultipleAlbums = this.state.hasMultipleAlbums;
  readonly selectedIds = this.state.selectedIds;
  readonly lightboxOpen = this.state.lightboxOpen;
  readonly lightboxIndex = this.state.lightboxIndex;
  readonly showConfirmDialog = this.state.showConfirmDialog;
  readonly showMinWarningDialog = this.state.showMinWarningDialog;

  // --- Computed delegálások ---
  readonly workflowPhotos = this.state.workflowPhotos;
  readonly lightboxMedia = this.state.lightboxMedia;

  ngOnInit(): void {
    this.state.init();
  }

  // --- Template-facing metódusok ---

  loadAlbum(): void {
    this.state.loadAlbum();
  }

  formatDate(dateStr: string | null): string {
    return this.state.formatDate(dateStr);
  }

  onSelectionChange(ids: number[]): void {
    this.state.updateSelection(ids);
  }

  onDeselectAll(): void {
    this.state.deselectAll();
  }

  onZoomClick(event: { photo: WorkflowPhoto; index: number }): void {
    this.state.openLightbox(event.index);
  }

  saveSelection(finalize: boolean): void {
    this.state.saveSelection(finalize);
  }

  confirmFinalize(): void {
    this.state.confirmFinalize();
  }

  onConfirmResult(result: ConfirmDialogResult): void {
    this.state.handleConfirmResult(result.action);
  }

  onMinWarningResult(): void {
    this.state.dismissMinWarning();
  }

  closeLightbox(): void {
    this.state.closeLightbox();
  }

  navigateLightbox(index: number): void {
    this.state.navigateLightbox(index);
  }
}
