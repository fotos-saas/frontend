import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';

/**
 * Inactive State Component
 *
 * Megjeleníti az inaktív állapotot, amikor még nincs galéria a projekthez.
 * Különböző üzenetek kapcsolattartóknak (code login) és vendégeknek (share).
 */
@Component({
  selector: 'app-inactive-state',
  standalone: true,
  imports: [],
  template: `
    <div class="photo-selection__inactive">
      <div class="photo-selection__inactive-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <h1 class="photo-selection__inactive-title">Képválasztás</h1>

      @if (isCoordinator()) {
        <!-- KAPCSOLATTARTÓ NÉZET -->
        <p class="photo-selection__inactive-message">
          @if (hasPhotoDate()) {
            A fotózás időpontja: <strong>{{ formattedPhotoDate() }}</strong>
            <br>
            <span class="photo-selection__inactive-sub">A képek feltöltés után válnak elérhetővé.</span>
          } @else {
            Még nincs beállítva a fotózás időpontja.
          }
        </p>

        @if (!hasPhotoDate()) {
          <button
            type="button"
            class="photo-selection__btn photo-selection__btn--primary"
            (click)="setPhotoDate.emit()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Időpont beállítása
          </button>
        }

        <!-- Lépések előnézete (kapcsolattartónak) -->
        <div class="photo-selection__preview-steps">
          <p class="photo-selection__preview-title">A képválasztás lépései:</p>
          <div class="photo-selection__preview-list">
            <div class="photo-selection__preview-step">
              <span class="photo-selection__preview-num">1</span>
              <span>Saját képek kijelölése</span>
            </div>
            <div class="photo-selection__preview-step">
              <span class="photo-selection__preview-num">2</span>
              <span>Retusálandó képek kiválasztása</span>
            </div>
            <div class="photo-selection__preview-step">
              <span class="photo-selection__preview-num">3</span>
              <span>Tablókép véglegesítése</span>
            </div>
          </div>
        </div>

        @if (hasPhotoDate()) {
          <div class="photo-selection__inactive-waiting">
            <div class="photo-selection__inactive-spinner"></div>
            <span>Várakozás a képekre...</span>
          </div>
        }
      } @else {
        <!-- VENDÉG NÉZET -->
        <p class="photo-selection__inactive-message">
          @if (hasPhotoDate()) {
            A fotózás időpontja: <strong>{{ formattedPhotoDate() }}</strong>
            <br><br>
            <span class="photo-selection__inactive-sub">
              Amint a fotós feltölti a képeket, értesítést kapsz és itt tudod majd kiválasztani a tablóképedet.
            </span>
          } @else {
            A fotózás időpontja még nincs beállítva.
            <br><br>
            <span class="photo-selection__inactive-sub">
              Amint megvan az időpont és a képek elkészülnek, értesítést kapsz.
            </span>
          }
        </p>

        @if (hasPhotoDate()) {
          <div class="photo-selection__inactive-waiting">
            <div class="photo-selection__inactive-spinner"></div>
            <span>Várakozás a képekre...</span>
          </div>
        }
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InactiveStateComponent {
  /** Kapcsolattartó-e a felhasználó (code login, nem share) */
  readonly isCoordinator = input.required<boolean>();

  /** Van-e fotózás dátum */
  readonly hasPhotoDate = input.required<boolean>();

  /** Formázott fotózás dátum */
  readonly formattedPhotoDate = input.required<string>();

  /** Fotózás dátum beállítása (csak kapcsolattartóknak) */
  readonly setPhotoDate = output<void>();
}
