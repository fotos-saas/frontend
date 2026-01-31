import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';

/**
 * Wizard header - cím és bezárás gomb.
 */
@Component({
  selector: 'app-wizard-header',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="wizard-header">
      <div class="header-content">
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <button type="button" class="close-btn" (click)="close.emit()">
        <lucide-icon [name]="ICONS.X" [size]="20" />
      </button>
    </div>
  `,
  styles: [`
    .wizard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border: none;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardHeaderComponent {
  readonly ICONS = ICONS;

  readonly title = input<string>('Képek feltöltése');
  readonly subtitle = input<string>('');

  readonly close = output<void>();
}
