import { Component, ChangeDetectionStrategy, computed, input, output, inject } from '@angular/core';
import { WorkflowStep, WORKFLOW_STEPS, getStepIndex } from '../../models/workflow.models';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Step Indicator Component
 *
 * KOMPAKT PILL-STYLE lépésjelző a workflow-hoz.
 * Inline horizontal pills - modern, space-efficient design.
 *
 * 3 aktív lépés: Saját képek → Retusálás → Tablókép (+ Kész állapot)
 *
 * Állapotok:
 * - active: aktuális lépés (kék pill, filled)
 * - completed: befejezett lépés (zöld pipa)
 * - disabled: jövőbeli lépés (outline only)
 */
@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [],
  template: `
    <nav class="step-pills" aria-label="Képválasztás folyamat">
      <!-- Leadva badge (completed state) -->
      @if (currentStep() === 'completed') {
        <div class="step-pills__done-badge" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Leadva
        </div>
      }

      <!-- Pills container -->
      <div class="step-pills__track">
        @for (step of visibleSteps; track step.step; let i = $index) {
          <button
            type="button"
            class="step-pills__pill"
            [class.step-pills__pill--active]="isActive(step.step)"
            [class.step-pills__pill--completed]="isCompleted(step.step)"
            [class.step-pills__pill--disabled]="isDisabled(step.step)"
            [attr.aria-current]="isActive(step.step) ? 'step' : null"
            [attr.aria-label]="step.label + (isCompleted(step.step) ? ' (kész)' : '')"
            (click)="onStepClick(step.step)"
          >
            <!-- Step number or checkmark -->
            <span class="step-pills__indicator">
              @if (isCompleted(step.step)) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else {
                {{ i + 1 }}
              }
            </span>

            <!-- Label (hidden on mobile, visible on tablet+) -->
            <span class="step-pills__label">{{ step.label }}</span>

            <!-- Info button (only active step) -->
            @if (isActive(step.step) && currentStep() !== 'completed') {
              <span
                class="step-pills__info"
                role="button"
                tabindex="0"
                aria-label="Információ"
                (click)="onInfoClick($event, step.step)"
                (keydown.enter)="onInfoKeydown($event, step.step)"
              >?</span>
            }
          </button>

          <!-- Connector arrow -->
          @if (i < visibleSteps.length - 1) {
            <span class="step-pills__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          }
        }
      </div>
    </nav>
  `,
  styleUrl: './step-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepIndicatorComponent {
  private readonly toast = inject(ToastService);

  /** Aktuális lépés */
  readonly currentStep = input.required<WorkflowStep>();

  /** Kattintás engedélyezve-e */
  readonly allowClick = input<boolean>(true);

  /** Lépésre kattintás esemény */
  readonly stepClick = output<WorkflowStep>();

  /** Info ikon kattintás esemény */
  readonly infoClick = output<WorkflowStep>();

  /** Workflow lépések (a 'completed' lépést nem mutatjuk a stepperben) */
  readonly visibleSteps = WORKFLOW_STEPS.filter(s => s.step !== 'completed');

  /** Aktuális step index */
  readonly currentStepIndex = computed(() => getStepIndex(this.currentStep()));

  /**
   * Aktív-e a lépés
   */
  isActive(step: WorkflowStep): boolean {
    return step === this.currentStep();
  }

  /**
   * Befejezett-e a lépés
   */
  isCompleted(step: WorkflowStep): boolean {
    const stepIndex = getStepIndex(step);
    // Ha a currentStep 'completed', akkor minden lépés completed
    if (this.currentStep() === 'completed') {
      return step !== 'completed';
    }
    return stepIndex < this.currentStepIndex();
  }

  /**
   * Letiltott-e a lépés (jövőbeli lépés)
   */
  isDisabled(step: WorkflowStep): boolean {
    if (this.currentStep() === 'completed') return false;
    const stepIndex = getStepIndex(step);
    return stepIndex > this.currentStepIndex();
  }

  /**
   * Kattintható-e a lépés (visszalépéshez vagy megtekintéshez)
   */
  isClickable(step: WorkflowStep): boolean {
    if (!this.allowClick()) return false;

    // Completed állapotban a befejezett lépések megtekinthetők
    if (this.currentStep() === 'completed') {
      return step !== 'completed';
    }

    // Normál módban csak befejezett lépésekre lehet visszalépni
    return this.isCompleted(step);
  }

  /**
   * Lépésre kattintás
   * - Ha completed állapotban: readonly megtekintés
   * - Ha valid (befejezett): visszalépés
   * - Ha nem valid (disabled/future): toast hibaüzenet
   */
  onStepClick(step: WorkflowStep): void {
    // Ha completed állapotban vagyunk, a lépések megtekinthetők readonly módban
    if (this.currentStep() === 'completed') {
      if (step !== 'completed') {
        this.stepClick.emit(step);
      }
      return;
    }

    // Ha kattintható (befejezett lépés) - visszalépés
    if (this.isClickable(step)) {
      this.stepClick.emit(step);
      return;
    }

    // Ha aktuális lépés - semmi nem történik
    if (this.isActive(step)) {
      return;
    }

    // Ha disabled (jövőbeli lépés) - toast hibaüzenet
    if (this.isDisabled(step)) {
      const stepInfo = WORKFLOW_STEPS.find(s => s.step === step);
      const currentStepInfo = WORKFLOW_STEPS.find(s => s.step === this.currentStep());

      this.toast.warning(
        'Előbb fejezd be az aktuális lépést',
        `A "${stepInfo?.label || step}" lépéshez először be kell fejezned a "${currentStepInfo?.label || this.currentStep()}" lépést.`
      );
    }
  }

  /**
   * Info ikon kattintás
   * Megnyitja az instrukciós dialógust az aktuális lépéshez
   */
  onInfoClick(event: MouseEvent, step: WorkflowStep): void {
    event.stopPropagation(); // Ne triggerelődjön a step kattintás
    this.infoClick.emit(step);
  }

  /**
   * Info ikon keydown handler (Enter)
   */
  onInfoKeydown(event: Event, step: WorkflowStep): void {
    event.stopPropagation();
    this.infoClick.emit(step);
  }
}
