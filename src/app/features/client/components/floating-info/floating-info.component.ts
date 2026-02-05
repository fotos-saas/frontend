import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FloatingFabComponent } from '../../../../shared/components/floating-fab/floating-fab.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Floating Info Component
 *
 * FAB gomb a jobb alsó sarokban az ügyfélnek szóló információkkal.
 * Elmagyarázza a mentés és véglegesítés közti különbséget.
 */
@Component({
  selector: 'app-floating-info',
  standalone: true,
  imports: [FloatingFabComponent, LucideAngularModule],
  template: `
    <app-floating-fab icon="info" color="blue" ariaLabel="Súgó" panelWidth="wide">
      <div class="info-content">
        <h3 class="info-title">
          <lucide-icon [name]="ICONS.INFO" [size]="18"></lucide-icon>
          Hogyan működik?
        </h3>

        <div class="info-section">
          <div class="info-item">
            <div class="info-icon info-icon--secondary">
              <lucide-icon [name]="ICONS.SAVE" [size]="16"></lucide-icon>
            </div>
            <div class="info-text">
              <strong>Mentés</strong>
              <p>Ideiglenesen elmenti a kiválasztásod. Bezárhatod az oldalt, legközelebb is emlékezni fog a rendszer.</p>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon info-icon--primary">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16"></lucide-icon>
            </div>
            <div class="info-text">
              <strong>Véglegesítés</strong>
              <p>Lezárja a választást. Ezután már nem módosítható!</p>
            </div>
          </div>
        </div>

        <div class="info-tip">
          <lucide-icon [name]="ICONS.INFO" [size]="14"></lucide-icon>
          <span>Tipp: Több képet is kijelölhetsz egyszerre a <kbd>Shift</kbd> + kattintással!</span>
        </div>
      </div>
    </app-floating-fab>
  `,
  styles: [`
    .info-content {
      color: #334155;
    }

    .info-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px;

      lucide-icon {
        color: #3b82f6;
      }
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &--secondary {
        background: #f1f5f9;
        color: #64748b;
      }

      &--primary {
        background: #dbeafe;
        color: #2563eb;
      }
    }

    .info-text {
      flex: 1;
      min-width: 0;

      strong {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }

      p {
        margin: 0;
        font-size: 13px;
        line-height: 1.4;
        color: #64748b;
      }
    }

    .info-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #f0f9ff;
      border-radius: 8px;
      font-size: 12px;
      color: #0369a1;
      border-left: 3px solid #3b82f6;

      lucide-icon {
        flex-shrink: 0;
      }

      kbd {
        display: inline-block;
        padding: 2px 6px;
        background: white;
        border: 1px solid #bae6fd;
        border-radius: 4px;
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingInfoComponent {
  protected readonly ICONS = ICONS;
}
