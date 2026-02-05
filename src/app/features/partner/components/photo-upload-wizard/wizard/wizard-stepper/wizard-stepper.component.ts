import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { WizardStep, StepDefinition, VISIBLE_STEPS } from '../wizard.types';

/**
 * Wizard stepper - lépések vizuális megjelenítése.
 */
@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="stepper">
      @for (step of steps; track step.id; let i = $index) {
        <div
          class="step"
          [class.step--active]="currentStep() === step.id"
          [class.step--completed]="isCompleted(step.id)"
          [class.step--clickable]="canGoTo(step.id)"
          (click)="onStepClick(step.id)"
        >
          <div class="step-indicator">
            @if (isCompleted(step.id)) {
              <lucide-icon [name]="ICONS.CHECK" [size]="14" />
            } @else {
              <span>{{ i + 1 }}</span>
            }
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
        @if (i < steps.length - 1) {
          <div class="step-connector" [class.step-connector--active]="isCompleted(step.id)"></div>
        }
      }
    </div>
  `,
  styles: [`
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 24px;
      gap: 8px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .step--clickable {
      cursor: pointer;
    }

    .step--clickable:hover {
      background: #f1f5f9;
    }

    .step-indicator {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      transition: all 0.2s ease;
    }

    .step--active .step-indicator {
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
    }

    .step--completed .step-indicator {
      background: #10b981;
      color: #ffffff;
    }

    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      transition: all 0.2s ease;
    }

    .step--active .step-label {
      color: #1e293b;
    }

    .step--completed .step-label {
      color: #10b981;
    }

    .step-connector {
      width: 40px;
      height: 2px;
      background: #e2e8f0;
      transition: all 0.2s ease;
    }

    .step-connector--active {
      background: #10b981;
    }

    @media (max-width: 480px) {
      .stepper {
        padding: 12px 16px;
        gap: 4px;
      }

      .step {
        padding: 6px 8px;
        gap: 4px;
      }

      .step-indicator {
        width: 24px;
        height: 24px;
        font-size: 0.6875rem;
      }

      .step-label {
        font-size: 0.75rem;
      }

      .step-connector {
        width: 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardStepperComponent {
  readonly ICONS = ICONS;
  readonly steps = VISIBLE_STEPS;

  readonly currentStep = input.required<WizardStep>();
  readonly completedSteps = input<WizardStep[]>([]);

  readonly stepClick = output<WizardStep>();

  isCompleted(stepId: WizardStep): boolean {
    return this.completedSteps().includes(stepId);
  }

  canGoTo(stepId: WizardStep): boolean {
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep());
    const targetIndex = this.steps.findIndex(s => s.id === stepId);
    return targetIndex < currentIndex && targetIndex >= 0;
  }

  onStepClick(stepId: WizardStep): void {
    if (this.canGoTo(stepId)) {
      this.stepClick.emit(stepId);
    }
  }
}
