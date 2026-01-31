import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ClientService, ClientAlbumDetail, ClientPhoto } from '../services/client.service';
import { SelectionGridComponent } from '../../photo-selection/components/selection-grid/selection-grid.component';
import { WorkflowPhoto } from '../../photo-selection/models/workflow.models';
import { MediaLightboxComponent } from '../../../shared/components/media-lightbox/media-lightbox.component';
import { LightboxMediaItem } from '../../../shared/components/media-lightbox/media-lightbox.types';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StickyFooterComponent } from '../../../shared/components/sticky-footer/sticky-footer.component';
import { FloatingInfoComponent } from '../components/floating-info/floating-info.component';
import { ICONS } from '../../../shared/constants/icons.constants';

/**
 * Client Album Detail - Album részletek fotó kiválasztási funkcióval
 *
 * Használja a meglévő SelectionGridComponent-et a fotók megjelenítéséhez.
 */
@Component({
  selector: 'app-client-album-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    SelectionGridComponent,
    MediaLightboxComponent,
    ConfirmDialogComponent,
    StickyFooterComponent,
    FloatingInfoComponent
  ],
  template: `
    <div class="album-detail-page page-card">
      <!-- Loading state -->
      @if (loading()) {
        <div class="loading-container">
          <div class="skeleton-header skeleton-shimmer"></div>
          <div class="skeleton-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="skeleton-photo skeleton-shimmer"></div>
            }
          </div>
        </div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="error-container">
          <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="48" class="error-icon"></lucide-icon>
          <p class="error-message">{{ error() }}</p>
          <button (click)="loadAlbum()" class="btn btn-primary">
            <lucide-icon [name]="ICONS.REFRESH" [size]="16"></lucide-icon>
            Újrapróbálás
          </button>
        </div>
      }

      <!-- Album content -->
      @if (!loading() && !error() && album()) {
        <!-- Compact Header -->
        <header class="album-header">
          @if (hasMultipleAlbums()) {
            <a routerLink="/client/albums" class="back-link">
              <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="18"></lucide-icon>
              Vissza
            </a>
          }
          <h1 class="album-title">{{ album()!.name }}</h1>
          @if (album()!.isCompleted) {
            <span class="completed-badge">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="14"></lucide-icon>
              Lezárva
            </span>
          }
        </header>

        <!-- Completed banner -->
        @if (album()!.isCompleted) {
          <div class="completed-banner">
            <div class="completed-banner__icon">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="24"></lucide-icon>
            </div>
            <div class="completed-banner__content">
              <h3 class="completed-banner__title">Választás véglegesítve!</h3>
              <p class="completed-banner__text">
                Sikeresen kiválasztottad a képeket. A fotós megkapta a választásodat és hamarosan dolgozni kezd rajtuk.
              </p>
              <div class="completed-banner__dates">
                @if (album()!.createdAt) {
                  <span class="date-item">
                    <lucide-icon [name]="ICONS.CALENDAR" [size]="12"></lucide-icon>
                    Megnyitva: {{ formatDate(album()!.createdAt) }}
                  </span>
                }
                @if (album()!.finalizedAt) {
                  <span class="date-item">
                    <lucide-icon [name]="ICONS.CHECK" [size]="12"></lucide-icon>
                    Lezárva: {{ formatDate(album()!.finalizedAt) }}
                  </span>
                }
              </div>
            </div>
            <div class="completed-banner__stats">
              <span class="stat-badge">
                <lucide-icon [name]="ICONS.CHECK" [size]="14"></lucide-icon>
                {{ selectedIds().length }} kép kiválasztva
              </span>
            </div>
          </div>
        } @else {
          <!-- Info bar - csak nem lezárt albumoknál -->
          <div class="album-info-bar">
            <span class="info-item">
              <lucide-icon [name]="ICONS.IMAGES" [size]="14"></lucide-icon>
              {{ album()!.photosCount }}
            </span>
            @if (album()!.minSelections || album()!.maxSelections) {
              <span class="info-divider">·</span>
              <span class="info-item info-item--limits">
                @if (album()!.minSelections) {min {{ album()!.minSelections }}}
                @if (album()!.minSelections && album()!.maxSelections) { / }
                @if (album()!.maxSelections) {max {{ album()!.maxSelections }}}
              </span>
            }
          </div>
        }

        <!-- Selection Grid (meglévő komponens!) -->
        <app-selection-grid
          [photos]="workflowPhotos()"
          [selectedIds]="selectedIds()"
          [allowMultiple]="true"
          [maxSelection]="album()!.maxSelections"
          [readonly]="album()!.isCompleted"
          [isLoading]="loading()"
          [isSaving]="saving()"
          [showHeader]="!album()!.isCompleted"
          [useVirtualScroll]="false"
          emptyMessage="Nincsenek képek az albumban"
          (selectionChange)="onSelectionChange($event)"
          (zoomClick)="onZoomClick($event)"
          (deselectAllClick)="onDeselectAll()"
        />

      }
    </div>

    <!-- Sticky footer (page-card KÍVÜL a backdrop-filter stacking context miatt!) -->
    @if (!loading() && !error() && album() && !album()!.isCompleted) {
      <app-sticky-footer
        [withSidebar]="true"
        [isSaving]="saving()"
        [primaryDisabled]="false"
        [secondaryDisabled]="selectedIds().length === 0"
        (primaryClick)="confirmFinalize()"
        (secondaryClick)="saveSelection(false)"
      />
    }

    <!-- Lightbox (page-card KÍVÜL a backdrop-filter stacking context miatt!) -->
    @if (lightboxOpen()) {
      <app-media-lightbox
        [media]="lightboxMedia()"
        [currentIndex]="lightboxIndex()"
        (close)="closeLightbox()"
        (navigate)="navigateLightbox($event)"
      />
    }

    <!-- Confirm dialog (page-card KÍVÜL!) -->
    @if (showConfirmDialog()) {
      <app-confirm-dialog
        title="Választás véglegesítése"
        message="Biztosan véglegesíted a választásodat? Ez a művelet nem vonható vissza."
        confirmText="Véglegesítés"
        cancelText="Mégse"
        confirmType="primary"
        [isSubmitting]="saving()"
        (resultEvent)="onConfirmResult($event)"
      />
    }

    <!-- Minimum warning dialog -->
    @if (showMinWarningDialog()) {
      <app-confirm-dialog
        title="Kevés kép kiválasztva"
        [message]="'Minimum ' + album()!.minSelections + ' képet kell kiválasztanod, de csak ' + selectedIds().length + ' van. Kérlek válassz ki még ' + (album()!.minSelections! - selectedIds().length) + ' képet!'"
        confirmText="Rendben"
        [showCancel]="false"
        confirmType="warning"
        (resultEvent)="onMinWarningResult()"
      />
    }

    <!-- Floating info gomb (page-card KÍVÜL!) -->
    @if (!loading() && !error() && album() && !album()!.isCompleted) {
      <app-floating-info />
    }
  `,
  styles: [`
    .album-detail-page {
      max-width: 1400px;
      margin: 0 auto;
      padding-bottom: 100px;
    }

    /* Loading skeleton */
    .skeleton-header {
      height: 100px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .skeleton-photo {
      aspect-ratio: 1;
      border-radius: 8px;
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error state */
    .error-container {
      text-align: center;
      padding: 48px 24px;
    }

    .error-icon {
      color: #dc2626;
      margin-bottom: 16px;
    }

    .error-message {
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    /* Compact Header */
    .album-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.8125rem;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: var(--primary-color);
    }

    .album-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #dcfce7;
      color: #166534;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 600;
    }

    :host-context(.dark) .completed-badge {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    /* Completed banner */
    .completed-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
      border: 1px solid #86efac;
      border-radius: 12px;
    }

    :host-context(.dark) .completed-banner {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .completed-banner__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #22c55e;
      border-radius: 50%;
      color: white;
      flex-shrink: 0;
    }

    .completed-banner__content {
      flex: 1;
      min-width: 0;
    }

    .completed-banner__title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #166534;
      margin: 0 0 4px 0;
    }

    :host-context(.dark) .completed-banner__title {
      color: #4ade80;
    }

    .completed-banner__text {
      font-size: 0.875rem;
      color: #15803d;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    :host-context(.dark) .completed-banner__text {
      color: #86efac;
    }

    .completed-banner__dates {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .date-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #166534;
      opacity: 0.8;
    }

    :host-context(.dark) .date-item {
      color: #86efac;
    }

    .completed-banner__stats {
      flex-shrink: 0;
    }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: white;
      color: #166534;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    :host-context(.dark) .stat-badge {
      background: rgba(0, 0, 0, 0.2);
      color: #4ade80;
    }

    @media (max-width: 640px) {
      .completed-banner {
        flex-direction: column;
        text-align: center;
        padding: 16px;
        gap: 12px;
      }

      .completed-banner__icon {
        width: 40px;
        height: 40px;
      }

      .completed-banner__title {
        font-size: 1rem;
      }

      .completed-banner__text {
        font-size: 0.8125rem;
      }
    }

    /* Info bar */
    .album-info-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 0.8125rem;
      color: #64748b;
    }

    :host-context(.dark) .album-info-bar {
      background: rgba(30, 41, 59, 0.5);
      color: #94a3b8;
    }

    .info-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .info-item--limits {
      font-weight: 500;
    }

    .info-divider {
      color: #cbd5e1;
    }

    :host-context(.dark) .info-divider {
      color: #475569;
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAlbumDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);
  private destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  // Album state
  album = signal<ClientAlbumDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  hasMultipleAlbums = signal(false);

  // Selection state
  selectedIds = signal<number[]>([]);

  // Lightbox state
  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

  // Confirm dialog state
  showConfirmDialog = signal(false);
  showMinWarningDialog = signal(false);

  // Computed: Convert ClientPhoto[] to WorkflowPhoto[]
  workflowPhotos = computed<WorkflowPhoto[]>(() => {
    const a = this.album();
    if (!a) return [];
    return a.photos.map(p => ({
      id: p.id,
      url: p.preview_url,
      thumbnailUrl: p.thumb_url,
      filename: p.name,
    }));
  });

  // Computed: lightbox media
  lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const a = this.album();
    if (!a) return [];
    return a.photos.map(p => ({
      id: p.id,
      url: p.preview_url,
      fileName: p.name,
    }));
  });

  // Computed: can finalize
  canFinalize = computed(() => {
    const a = this.album();
    const selected = this.selectedIds();
    if (!a || selected.length === 0) return false;
    if (a.minSelections && selected.length < a.minSelections) return false;
    if (a.maxSelections && selected.length > a.maxSelections) return false;
    return true;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.router.navigate(['/client/albums']);
      return;
    }
    this.checkAlbumsCount();
    this.loadAlbum();
  }

  /** Ellenőrzi, hogy több album van-e (vissza gomb megjelenítéshez) */
  checkAlbumsCount(): void {
    this.clientService.getAlbums().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.hasMultipleAlbums.set(response.data.length > 1);
      }
    });
  }

  loadAlbum(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.error.set(null);

    this.clientService.getAlbum(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.album.set(response.data);
        // Initialize selected IDs from progress
        this.selectedIds.set(response.data.progress?.claimedIds ?? []);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  /** Dátum formázás magyar formátumban */
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Selection grid events
  onSelectionChange(ids: number[]): void {
    this.selectedIds.set(ids);
  }

  onDeselectAll(): void {
    this.selectedIds.set([]);
  }

  onZoomClick(event: { photo: WorkflowPhoto; index: number }): void {
    this.lightboxIndex.set(event.index);
    this.lightboxOpen.set(true);
  }

  // Save methods
  saveSelection(finalize: boolean): void {
    const a = this.album();
    if (!a) return;

    this.saving.set(true);

    // Simple selection type
    if (a.type === 'selection') {
      this.clientService.saveSimpleSelection(a.id, this.selectedIds(), finalize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.data.isCompleted) {
            this.router.navigate(['/client/albums']);
          }
        },
        error: (err: Error) => {
          this.saving.set(false);
          this.error.set(err.message);
        }
      });
    } else {
      // Tablo type - save as claiming step for now
      this.clientService.saveTabloSelection(a.id, 'claiming', this.selectedIds(), finalize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.data.isCompleted) {
            this.router.navigate(['/client/albums']);
          }
        },
        error: (err: Error) => {
          this.saving.set(false);
          this.error.set(err.message);
        }
      });
    }
  }

  confirmFinalize(): void {
    const a = this.album();
    const selected = this.selectedIds();

    // Ellenőrizzük a minimum mennyiséget
    if (a?.minSelections && selected.length < a.minSelections) {
      this.showMinWarningDialog.set(true);
      return;
    }

    this.showConfirmDialog.set(true);
  }

  onConfirmResult(result: ConfirmDialogResult): void {
    this.showConfirmDialog.set(false);
    if (result.action === 'confirm') {
      this.saveSelection(true);
    }
  }

  onMinWarningResult(): void {
    this.showMinWarningDialog.set(false);
  }

  // Lightbox methods
  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  navigateLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }
}
