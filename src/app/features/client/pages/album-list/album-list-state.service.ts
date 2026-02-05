import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ClientService, ClientAlbum } from '../../services/client.service';

/**
 * Album lista állapotkezelő service.
 * Komponens-szintű provider (providedIn: null).
 */
@Injectable({ providedIn: null })
export class AlbumListStateService {
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Albumok listája */
  readonly albums = signal<ClientAlbum[]>([]);

  /** Betöltés folyamatban */
  readonly loading = signal(true);

  /** Hibaüzenet */
  readonly error = signal<string | null>(null);

  /**
   * Albumok betöltése az API-ból.
   * Ha csak 1 album van, automatikusan átirányít.
   */
  loadAlbums(): void {
    this.loading.set(true);
    this.error.set(null);

    this.clientService.getAlbums().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        // Ha csak 1 album van, egyből átirányítás
        if (response.data.length === 1) {
          this.router.navigate(['/client/albums', response.data[0].id]);
          return;
        }
        this.albums.set(response.data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
