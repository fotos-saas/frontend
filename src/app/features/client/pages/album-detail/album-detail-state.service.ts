import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, ClientAlbumDetail } from '../../services/client.service';
import { WorkflowPhoto } from '../../../photo-selection/models/workflow.models';
import { LightboxMediaItem } from '../../../../shared/components/media-lightbox/media-lightbox.types';

/**
 * Album detail komponens állapotkezelő service.
 * Komponens-szintű provider (providedIn: null).
 */
@Injectable({ providedIn: null })
export class AlbumDetailStateService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);
  private destroyRef = inject(DestroyRef);

  // --- Állapot ---
  readonly album = signal<ClientAlbumDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly hasMultipleAlbums = signal(false);
  readonly selectedIds = signal<number[]>([]);

  // Lightbox
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);

  // Dialógusok
  readonly showConfirmDialog = signal(false);
  readonly showMinWarningDialog = signal(false);

  // --- Computed ---
  readonly workflowPhotos = computed<WorkflowPhoto[]>(() => {
    const a = this.album();
    if (!a) return [];
    return a.photos.map(p => ({
      id: p.id,
      url: p.preview_url,
      thumbnailUrl: p.thumb_url,
      filename: p.name,
    }));
  });

  readonly lightboxMedia = computed<LightboxMediaItem[]>(() => {
    const a = this.album();
    if (!a) return [];
    return a.photos.map(p => ({
      id: p.id,
      url: p.preview_url,
      fileName: p.name,
    }));
  });

  readonly canFinalize = computed(() => {
    const a = this.album();
    const selected = this.selectedIds();
    if (!a || selected.length === 0) return false;
    if (a.minSelections && selected.length < a.minSelections) return false;
    if (a.maxSelections && selected.length > a.maxSelections) return false;
    return true;
  });

  // --- Album ID ---
  private get albumId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  // --- Publikus metódusok ---

  /** Inicializálás: route validáció + betöltés */
  init(): void {
    const id = this.albumId;
    if (!id || isNaN(id) || id < 1) {
      this.router.navigate(['/client/albums']);
      return;
    }
    this.checkAlbumsCount();
    this.loadAlbum();
  }

  /** Album betöltése */
  loadAlbum(): void {
    const id = this.albumId;
    this.loading.set(true);
    this.error.set(null);

    this.clientService.getAlbum(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.album.set(response.data);
        this.selectedIds.set(response.data.progress?.claimedIds ?? []);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  /** Kiválasztás módosítása */
  updateSelection(ids: number[]): void {
    this.selectedIds.set(ids);
  }

  /** Összes kijelölés törlése */
  deselectAll(): void {
    this.selectedIds.set([]);
  }

  /** Kiválasztás mentése */
  saveSelection(finalize: boolean): void {
    const a = this.album();
    if (!a) return;

    this.saving.set(true);

    if (a.type === 'selection') {
      this.clientService.saveSimpleSelection(a.id, this.selectedIds(), finalize)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
      this.clientService.saveTabloSelection(a.id, 'claiming', this.selectedIds(), finalize)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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

  /** Véglegesítés megerősítése (minimum ellenőrzéssel) */
  confirmFinalize(): void {
    const a = this.album();
    const selected = this.selectedIds();

    if (a?.minSelections && selected.length < a.minSelections) {
      this.showMinWarningDialog.set(true);
      return;
    }

    this.showConfirmDialog.set(true);
  }

  /** Megerősítő dialógus eredménye */
  handleConfirmResult(action: string): void {
    this.showConfirmDialog.set(false);
    if (action === 'confirm') {
      this.saveSelection(true);
    }
  }

  /** Minimum figyelmeztetés bezárása */
  dismissMinWarning(): void {
    this.showMinWarningDialog.set(false);
  }

  // --- Lightbox ---

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  navigateLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  // --- Segéd ---

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

  // --- Privát ---

  private checkAlbumsCount(): void {
    this.clientService.getAlbums().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.hasMultipleAlbums.set(response.data.length > 1);
      }
    });
  }
}
