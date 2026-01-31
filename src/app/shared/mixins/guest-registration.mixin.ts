import { signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuestService } from '../../core/services/guest.service';
import { AuthService } from '../../core/services/auth.service';
import { GuestNameResult } from '../components/guest-name-dialog/guest-name-dialog.component';

/**
 * GuestRegistrationMixin
 *
 * Közös vendég regisztrációs logika a komponensekhez.
 * Használat: forum-list, forum-detail, newsfeed-list
 *
 * @example
 * class MyComponent {
 *   private guestReg = new GuestRegistrationMixin(
 *     this.guestService,
 *     this.authService,
 *     this.destroyRef
 *   );
 *
 *   // Template-ben:
 *   // [showGuestNameDialog]="guestReg.showDialog()"
 *   // [isSubmitting]="guestReg.isRegistering()"
 *   // [errorMessage]="guestReg.error()"
 *   // (result)="guestReg.handleResult($event, loadDataCallback)"
 * }
 */
export class GuestRegistrationMixin {
  /** Dialógus megjelenítése */
  readonly showDialog = signal<boolean>(false);

  /** Regisztráció folyamatban */
  readonly isRegistering = signal<boolean>(false);

  /** Hiba üzenet */
  readonly error = signal<string | null>(null);

  constructor(
    private guestService: GuestService,
    private authService: AuthService,
    private destroyRef: DestroyRef
  ) {}

  /**
   * Ellenőrzi, hogy szükséges-e a vendég névbekérés
   * Hívd meg ngOnInit-ben
   *
   * @returns true ha meg kell jeleníteni a dialógust
   */
  checkAndShowDialog(): boolean {
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showDialog.set(true);
      return true;
    }
    return false;
  }

  /**
   * Guest név dialógus eredmény kezelése
   *
   * @param result A dialógus eredménye
   * @param onSuccess Callback sikeres regisztráció után (pl. loadData)
   */
  handleResult(result: GuestNameResult, onSuccess?: () => void): void {
    if (result.action === 'close') return;

    this.isRegistering.set(true);
    this.error.set(null);

    this.guestService.register(result.name, result.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showDialog.set(false);
          this.isRegistering.set(false);
          onSuccess?.();
        },
        error: (err) => {
          this.error.set(err.message);
          this.isRegistering.set(false);
        }
      });
  }

  /**
   * Dialógus bezárása (cancel esetén)
   */
  closeDialog(): void {
    this.showDialog.set(false);
    this.error.set(null);
  }
}
