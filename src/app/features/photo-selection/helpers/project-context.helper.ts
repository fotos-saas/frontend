import { computed, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { TabloProject } from '../../../core/models/auth.models';

/**
 * Project Context Helper
 *
 * Projekt-related computed signal-ok kezelése.
 * Centralizálja a projekt állapot lekérdezését.
 */
export class ProjectContextHelper {
  private readonly project: Signal<TabloProject | null>;

  constructor(private readonly authService: AuthService) {
    this.project = toSignal(this.authService.project$, { initialValue: null });
  }

  /** Projekt betöltődött-e már (nem null) */
  readonly isLoaded = computed(() => this.project() !== null);

  /** Van-e galéria csatolva a projekthez */
  readonly hasGallery = computed(() => {
    const proj = this.project();
    return !!proj?.hasGallery || !!proj?.tabloGalleryId;
  });

  /** Inaktív állapot - nincs galéria (csak ha projekt már betöltődött) */
  readonly isInactive = computed(() => this.isLoaded() && !this.hasGallery());

  /** Van-e fotózás dátum */
  readonly hasPhotoDate = computed(() => !!this.project()?.photoDate);

  /** Formázott fotózás dátum */
  readonly formattedPhotoDate = computed(() => {
    const date = this.project()?.photoDate;
    if (!date) return '';
    return new Date(date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  /** Kapcsolattartó-e a felhasználó (code login, nem share) */
  readonly isCoordinator = computed(() => this.authService.hasFullAccess());

  /** Vendég-e (share link) */
  readonly isGuest = computed(() => this.authService.isGuest());

  /** Galéria ID */
  readonly galleryId = computed(() => this.project()?.tabloGalleryId || null);

  /** Projekt ID */
  readonly projectId = computed(() => this.project()?.id || null);

  /** Határidő (raw string) */
  readonly deadline = computed(() => this.project()?.deadline ?? null);

  /** Van-e határidő beállítva */
  readonly hasDeadline = computed(() => !!this.deadline());

  /** Határidő lejárt-e */
  readonly isDeadlineExpired = computed(() => {
    const d = this.deadline();
    if (!d) return false;
    const deadlineDate = new Date(d + 'T23:59:59');
    return deadlineDate < new Date();
  });

  /** Hátralévő napok száma (negatív ha lejárt) */
  readonly daysRemaining = computed(() => {
    const d = this.deadline();
    if (!d) return null;
    const deadlineDate = new Date(d + 'T23:59:59');
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  });

  /** Formázott határidő dátum */
  readonly deadlineFormatted = computed(() => {
    const d = this.deadline();
    if (!d) return null;
    return new Date(d).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });
}
