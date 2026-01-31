import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { GuestService } from '../services/guest.service';
import { AuthService } from '../services/auth.service';

/**
 * Guest Registration Result
 */
export interface GuestRegistrationResult {
  success: boolean;
  error?: string;
}

/**
 * Guest Registration Facade
 *
 * Közös guest regisztrációs logika kiszervezése.
 * Használható voting-list és voting-detail komponensekben.
 *
 * Usage:
 * ```typescript
 * export class MyComponent {
 *   guestFacade = inject(GuestRegistrationFacade);
 *
 *   ngOnInit() {
 *     if (this.guestFacade.needsRegistration()) {
 *       this.guestFacade.showDialog.set(true);
 *     }
 *
 *     this.guestFacade.registered$.subscribe(() => {
 *       this.loadData(); // Újratöltés sikeres regisztráció után
 *     });
 *   }
 *
 *   onGuestNameResult(result: GuestNameResult) {
 *     this.guestFacade.handleRegistration(result);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class GuestRegistrationFacade {
  private readonly destroyRef = inject(DestroyRef);

  /** Dialógus megjelenítése */
  readonly showDialog = signal<boolean>(false);

  /** Regisztráció folyamatban */
  readonly isRegistering = signal<boolean>(false);

  /** Hibaüzenet */
  readonly error = signal<string | null>(null);

  /** Sikeres regisztráció esemény */
  private registeredSubject = new Subject<void>();
  readonly registered$ = this.registeredSubject.asObservable();

  constructor(
    private guestService: GuestService,
    private authService: AuthService
  ) {}

  /**
   * Ellenőrzi, hogy szükséges-e a guest regisztráció
   * Csak 'share' session esetén szükséges - a 'code' session kapcsolattartóként működik
   */
  needsRegistration(): boolean {
    return this.authService.isGuest() && !this.guestService.hasRegisteredSession();
  }

  /**
   * Inicializálja a guest regisztrációs folyamatot
   * Hívd meg a komponens ngOnInit-jében
   */
  checkAndShowDialog(): void {
    if (this.needsRegistration()) {
      this.showDialog.set(true);
    }
  }

  /**
   * Guest név dialógus eredmény kezelése
   */
  handleRegistration(result: { action: string; name?: string; email?: string }): Observable<GuestRegistrationResult> {
    return new Observable(observer => {
      if (result.action === 'close' || !result.name) {
        observer.next({ success: false });
        observer.complete();
        return;
      }

      this.isRegistering.set(true);
      this.error.set(null);

      this.guestService.register(result.name, result.email).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.showDialog.set(false);
          this.isRegistering.set(false);
          this.registeredSubject.next();
          observer.next({ success: true });
          observer.complete();
        },
        error: (err) => {
          const errorMessage = err.message || 'Hiba a regisztráció során';
          this.error.set(errorMessage);
          this.isRegistering.set(false);
          observer.next({ success: false, error: errorMessage });
          observer.complete();
        }
      });
    });
  }

  /**
   * Egyszerűsített regisztráció kezelés (void return)
   * Használható ha nem kell az eredményt figyelni
   */
  register(name: string, email?: string, onSuccess?: () => void, onError?: (error: string) => void): void {
    this.isRegistering.set(true);
    this.error.set(null);

    this.guestService.register(name, email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showDialog.set(false);
        this.isRegistering.set(false);
        this.registeredSubject.next();
        onSuccess?.();
      },
      error: (err) => {
        const errorMessage = err.message || 'Hiba a regisztráció során';
        this.error.set(errorMessage);
        this.isRegistering.set(false);
        onError?.(errorMessage);
      }
    });
  }

  /**
   * Dialógus megnyitása
   */
  openDialog(): void {
    this.error.set(null);
    this.showDialog.set(true);
  }

  /**
   * Dialógus bezárása
   */
  closeDialog(): void {
    this.showDialog.set(false);
    this.error.set(null);
  }

  /**
   * Állapot visszaállítása
   */
  reset(): void {
    this.showDialog.set(false);
    this.isRegistering.set(false);
    this.error.set(null);
  }
}
