import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';

/**
 * Photo Selection Badge Service
 *
 * Megmondja, hogy kell-e villogó badge a Képválasztás menüpont mellett.
 *
 * Szabály:
 * - Van galéria (hasGallery=true)
 * - Még nincs véglegesítve a választás (isFinalized=false)
 * - Badge: "!" vagy "Új"
 */
@Injectable({
  providedIn: 'root'
})
export class PhotoSelectionBadgeService {
  private readonly authService = inject(AuthService);

  /** Projekt adatok signal-ként */
  private readonly projectSignal = toSignal(this.authService.project$, { initialValue: null });

  /**
   * Kell-e badge a Képválasztás menüpont mellé
   */
  readonly shouldShowBadge = computed(() => {
    const project = this.projectSignal();
    if (!project) return false;

    // Van galéria és nincs véglegesítve
    const hasGallery = !!project.hasGallery;
    const isFinalized = !!project.photoSelectionFinalized;

    return hasGallery && !isFinalized;
  });

  /**
   * Badge szöveg
   */
  readonly badgeText = computed(() => {
    return this.shouldShowBadge() ? '!' : null;
  });
}
