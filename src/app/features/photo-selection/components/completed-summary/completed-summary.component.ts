import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { WorkflowPhoto, ProgressData } from '../../models/workflow.models';

/**
 * Completed Summary Component
 *
 * Read-only összesítő nézet a workflow befejezése után.
 * Statisztikák: saját képek, retusált képek, tablókép.
 */
@Component({
  selector: 'app-completed-summary',
  standalone: true,
  imports: [],
  template: `
    <div class="completed-summary">
      <!-- Success banner -->
      <div class="completed-summary__banner">
        <div class="completed-summary__success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="completed-summary__title">Képválasztás véglegesítve!</h2>
        <p class="completed-summary__subtitle">
          A választásod sikeresen rögzítve lett. Köszönjük!
        </p>
      </div>

      <!-- Statistics -->
      <div class="completed-summary__stats">
        <div class="completed-summary__stat">
          <div class="completed-summary__stat-value">{{ claimedCount }}</div>
          <div class="completed-summary__stat-label">Saját kép</div>
        </div>
        <div class="completed-summary__stat">
          <div class="completed-summary__stat-value">{{ retouchCount }}</div>
          <div class="completed-summary__stat-label">Retusálandó</div>
        </div>
        <div class="completed-summary__stat completed-summary__stat--highlight">
          <div class="completed-summary__stat-value">1</div>
          <div class="completed-summary__stat-label">Tablókép</div>
        </div>
      </div>

      <!-- Tablo photo preview -->
      @if (tabloPhoto()) {
        <div class="completed-summary__tablo">
          <h3 class="completed-summary__tablo-title">Kiválasztott tablókép</h3>
          <div class="completed-summary__tablo-image-container">
            <img
              [src]="tabloPhoto()!.url"
              [alt]="tabloPhoto()!.filename"
              class="completed-summary__tablo-image"
              (click)="onTabloClick()"
            />
            <button
              type="button"
              class="completed-summary__zoom-btn"
              aria-label="Tablókép nagyítása"
              (click)="onTabloClick()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Review hint -->
      <div class="completed-summary__hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <p>
          A fenti lépésekre kattintva visszanézheted a kiválasztott képeidet.
        </p>
      </div>

      <!-- Contact info -->
      <div class="completed-summary__info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>
          Ha bármilyen kérdésed van, keresd a szervezőket!
        </p>
      </div>
    </div>
  `,
  styleUrl: './completed-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedSummaryComponent {
  /** Progress adatok */
  readonly progress = input.required<ProgressData | null>();

  /** Tablókép (a visible photos-ból) */
  readonly tabloPhoto = input<WorkflowPhoto | null>(null);

  /** Tablókép kattintás (lightbox) */
  readonly tabloClick = output<WorkflowPhoto>();

  /** Claimed képek száma */
  get claimedCount(): number {
    return this.progress()?.steps_data?.claimed_count || 0;
  }

  /** Retusálandó képek száma */
  get retouchCount(): number {
    return this.progress()?.steps_data?.retouch_count || 0;
  }

  /**
   * Tablóképre kattintás
   */
  onTabloClick(): void {
    const photo = this.tabloPhoto();
    if (photo) {
      this.tabloClick.emit(photo);
    }
  }
}
