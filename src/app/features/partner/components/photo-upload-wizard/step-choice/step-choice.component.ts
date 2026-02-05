import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';

/**
 * Step Choice - AI vs Manuális párosítás választó.
 *
 * Két nagy kártya gombot jelenít meg:
 * - AI párosítás: automatikus név-alapú párosítás
 * - Manuális párosítás: drag & drop a review képernyőn
 */
@Component({
  selector: 'app-step-choice',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="step-choice">
      <div class="choice-header">
        <h3>Hogyan szeretnéd párosítani a képeket?</h3>
        <p>{{ photoCount() }} kép vár párosításra</p>
      </div>

      <div class="choice-cards">
        <!-- AI Párosítás -->
        <button
          type="button"
          class="choice-card choice-card--ai"
          [disabled]="loading()"
          (click)="aiSelected.emit()"
        >
          <div class="card-icon">
            <lucide-icon [name]="ICONS.WAND" [size]="40" />
          </div>
          <h4>AI párosítás</h4>
          <p>Automatikusan párosítjuk a képeket a fájlnevek és metaadatok alapján</p>
          <div class="card-features">
            <span><lucide-icon [name]="ICONS.CHECK" [size]="14" /> Gyors</span>
            <span><lucide-icon [name]="ICONS.CHECK" [size]="14" /> Automatikus</span>
            <span><lucide-icon [name]="ICONS.CHECK" [size]="14" /> Utólag módosítható</span>
          </div>
          @if (loading()) {
            <div class="card-loading">
              <span class="spinner"></span>
              <span>Párosítás folyamatban...</span>
            </div>
          }
        </button>

        <!-- Manuális Párosítás -->
        <button
          type="button"
          class="choice-card choice-card--manual"
          [disabled]="loading()"
          (click)="manualSelected.emit()"
        >
          <div class="card-icon">
            <lucide-icon [name]="ICONS.HAND" [size]="40" />
          </div>
          <h4>Manuális párosítás</h4>
          <p>Te húzod a képeket a megfelelő személyekhez drag & drop módszerrel</p>
          <div class="card-features">
            <span><lucide-icon [name]="ICONS.CHECK" [size]="14" /> Teljes kontroll</span>
            <span><lucide-icon [name]="ICONS.CHECK" [size]="14" /> Egyedi esetekhez</span>
            <span><lucide-icon [name]="ICONS.CHECK" [size]="14" /> Pontos párosítás</span>
          </div>
        </button>
      </div>

      <div class="choice-hint">
        <lucide-icon [name]="ICONS.INFO" [size]="16" />
        <span>Mindkét esetben lehetőséged van utólag módosítani a párosításokat.</span>
      </div>
    </div>
  `,
  styles: [`
    .step-choice {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      padding: 24px 0;
    }

    .choice-header {
      text-align: center;
    }

    .choice-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .choice-header p {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    /* Choice Cards Grid */
    .choice-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      width: 100%;
      max-width: 600px;
    }

    /* Choice Card */
    .choice-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 28px 20px;
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .choice-card:hover:not(:disabled) {
      border-color: var(--color-primary, #1e3a5f);
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
    }

    .choice-card:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .choice-card--ai:hover:not(:disabled) {
      border-color: #8b5cf6;
      background: linear-gradient(180deg, #faf5ff 0%, #ffffff 100%);
    }

    .choice-card--ai:hover:not(:disabled) .card-icon {
      background: #8b5cf6;
      color: #ffffff;
    }

    .choice-card--manual:hover:not(:disabled) {
      border-color: #0ea5e9;
      background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
    }

    .choice-card--manual:hover:not(:disabled) .card-icon {
      background: #0ea5e9;
      color: #ffffff;
    }

    /* Card Icon */
    .card-icon {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 16px;
      color: #64748b;
      transition: all 0.2s ease;
    }

    /* Card Title */
    .choice-card h4 {
      font-size: 1.0625rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    /* Card Description */
    .choice-card p {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }

    /* Card Features */
    .card-features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }

    .card-features span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 500;
      color: #64748b;
    }

    .choice-card--ai:hover:not(:disabled) .card-features span {
      background: #ede9fe;
      color: #6d28d9;
    }

    .choice-card--manual:hover:not(:disabled) .card-features span {
      background: #e0f2fe;
      color: #0369a1;
    }

    /* Loading State */
    .card-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 14px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Hint */
    .choice-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Mobile Responsive */
    @media (max-width: 560px) {
      .choice-cards {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .choice-card {
        padding: 20px 16px;
      }

      .card-icon {
        width: 56px;
        height: 56px;
      }

      .card-features {
        gap: 6px;
      }

      .card-features span {
        font-size: 0.625rem;
        padding: 3px 6px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepChoiceComponent {
  readonly ICONS = ICONS;

  // Inputs
  readonly photoCount = input(0);
  readonly loading = input(false);

  // Outputs
  @Output() aiSelected = new EventEmitter<void>();
  @Output() manualSelected = new EventEmitter<void>();
}
