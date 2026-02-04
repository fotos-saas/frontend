import { Injectable, NgZone, OnDestroy, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UpdateState } from './electron.service';

// Re-export for backward compatibility
export { UpdateState } from './electron.service';

type CleanupFn = () => void;

const initialState: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  progress: 0,
  version: null,
  releaseNotes: null,
};

/**
 * AutoUpdateService - Electron automatikus frissites szolgaltatas
 *
 * Funkcionalitas:
 * - Automatikus frissites ellenorzes app inditaskor
 * - Manualis frissites ellenorzes
 * - Letoltes progress kovetes
 * - Frissites telepites ujrainditassal
 *
 * Hasznalat:
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   updateService = inject(AutoUpdateService);
 *
 *   checkUpdates() {
 *     this.updateService.checkForUpdates();
 *   }
 *
 *   downloadUpdate() {
 *     this.updateService.downloadUpdate();
 *   }
 *
 *   installUpdate() {
 *     this.updateService.installUpdate();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AutoUpdateService implements OnDestroy {
  // Signals for reactive state management
  private _state = signal<UpdateState>(initialState);

  // Computed signals for easy access
  readonly state = this._state.asReadonly();
  readonly isChecking = computed(() => this._state().checking);
  readonly updateAvailable = computed(() => this._state().available);
  readonly isDownloading = computed(() => this._state().downloading);
  readonly updateDownloaded = computed(() => this._state().downloaded);
  readonly downloadProgress = computed(() => this._state().progress);
  readonly updateVersion = computed(() => this._state().version);
  readonly releaseNotes = computed(() => this._state().releaseNotes);
  readonly error = computed(() => this._state().error);

  // BehaviorSubject for RxJS subscribers
  private state$ = new BehaviorSubject<UpdateState>(initialState);
  private cleanupFunctions: CleanupFn[] = [];

  constructor(private ngZone: NgZone) {
    this.initStatusListener();
    this.loadInitialStatus();
  }

  ngOnDestroy(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  /**
   * Check if running in Electron environment
   */
  get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  /**
   * Observable for update state changes (RxJS)
   */
  get stateChanges(): Observable<UpdateState> {
    return this.state$.asObservable();
  }

  /**
   * Frissites ellenorzese manualis
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.isElectron) {
      console.log('Nem Electron kornyezet - frissites ellenorzes kihagyva');
      return false;
    }

    try {
      const result = await window.electronAPI!.autoUpdate.checkForUpdates();
      return result.success && (result.updateAvailable ?? false);
    } catch (error) {
      console.error('Frissites ellenorzesi hiba:', error);
      return false;
    }
  }

  /**
   * Frissites letoltese
   */
  async downloadUpdate(): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }

    try {
      const result = await window.electronAPI!.autoUpdate.downloadUpdate();
      if (!result.success && result.error) {
        console.error('Frissites letoltesi hiba:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('Frissites letoltesi hiba:', error);
      return false;
    }
  }

  /**
   * Frissites telepitese (ujrainditja az alkalmazast)
   */
  async installUpdate(): Promise<void> {
    if (!this.isElectron) {
      return;
    }

    try {
      await window.electronAPI!.autoUpdate.installUpdate();
      // Az app ujraindul, szoval ide nem jutunk vissza
    } catch (error) {
      console.error('Frissites telepitesi hiba:', error);
    }
  }

  /**
   * Kezdeti statusz betoltese
   */
  private async loadInitialStatus(): Promise<void> {
    if (!this.isElectron) {
      return;
    }

    try {
      const status = await window.electronAPI!.autoUpdate.getStatus();
      this.updateState(status);
    } catch (error) {
      console.error('Kezdeti statusz betoltesi hiba:', error);
    }
  }

  /**
   * Statusz valtozas figyelese
   */
  private initStatusListener(): void {
    if (!this.isElectron) {
      return;
    }

    const cleanup = window.electronAPI!.autoUpdate.onStatusChange((status) => {
      this.ngZone.run(() => {
        this.updateState(status);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Allapot frissitese
   */
  private updateState(newState: UpdateState): void {
    this._state.set(newState);
    this.state$.next(newState);
  }

  /**
   * Felhasznaloi uzenet a jelenlegi allapothoz
   */
  getStatusMessage(): string {
    const s = this._state();

    if (s.error) {
      return `Hiba: ${s.error}`;
    }
    if (s.checking) {
      return 'Frissites keresese...';
    }
    if (s.downloading) {
      return `Letoltes: ${s.progress}%`;
    }
    if (s.downloaded) {
      return `Frissites kesz (v${s.version}) - Ujrainditas szukseges`;
    }
    if (s.available) {
      return `Uj verzio elerheto: v${s.version}`;
    }
    return 'A legfrissebb verziot hasznalod';
  }

  /**
   * Van-e teendo a felhasznalonak?
   */
  hasAction(): boolean {
    const s = this._state();
    return s.available || s.downloaded;
  }
}
