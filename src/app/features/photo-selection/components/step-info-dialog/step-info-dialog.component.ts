import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { WorkflowStep, getStepInfo, STEP_INFO_NAMES } from '../../models/workflow.models';
import { TabloStorageService } from '../../../../core/services/tablo-storage.service';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';

/** Step → Lucide ikon mapping */
const STEP_ICONS: Record<string, string> = {
  claiming: ICONS.EYE,
  retouch: ICONS.EDIT,
  tablo: ICONS.IMAGE,
  completed: ICONS.CHECK_CIRCLE,
};

/**
 * Step Info Dialog Component
 *
 * Modal dialógus, amely elmagyarázza az aktuális lépést.
 * localStorage tracking - csak első megnyitáskor jelenik meg.
 */
@Component({
  selector: 'app-step-info-dialog',
  standalone: true,
  imports: [DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      headerStyle="hero"
      theme="blue"
      [icon]="stepIcon()"
      [title]="stepTitle()"
      [description]="stepMessage()"
      size="sm"
      [closable]="true"
      footerAlign="center"
      (closeEvent)="onConfirm()"
      (submitEvent)="onConfirm()"
    >
      <!-- Highlight box retouch lépésnél -->
      @if (step() === 'retouch' && maxPhotos()) {
        <div dialogBody class="step-info-dialog__highlight">
          Maximum <strong>{{ maxPhotos() }}</strong> képet választhatsz.
        </div>
      }

      <!-- Footer gomb -->
      <ng-container dialogFooter>
        <button
          type="button"
          class="step-info-dialog__button"
          (click)="onConfirm()"
        >
          Megértettem
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  styleUrl: './step-info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepInfoDialogComponent {
  private readonly storage = inject(TabloStorageService);

  /** Aktuális lépés */
  readonly step = input.required<WorkflowStep>();

  /** Projekt ID (a projekt-specifikus storage-hoz) */
  readonly projectId = input<number | null>(null);

  /** Egyedi üzenet (felülírja a default-ot) */
  readonly customMessage = input<string | null>(null);

  /** Maximum fotók száma (retouch lépésnél) */
  readonly maxPhotos = input<number | null>(null);

  /** Bezárás esemény */
  readonly closeEvent = output<void>();

  /** Computed: ikon a lépés alapján */
  readonly stepIcon = computed(() => STEP_ICONS[this.step()] || ICONS.CHECK_CIRCLE);

  /** Computed: cím a lépés alapján */
  readonly stepTitle = computed(() => {
    const info = getStepInfo(this.step());
    return info?.infoDialogTitle || 'Információ';
  });

  /** Computed: üzenet a lépés alapján */
  readonly stepMessage = computed(() => {
    return this.customMessage() || getStepInfo(this.step())?.infoDialogMessage || '';
  });

  /**
   * Megértettem gombra kattintás
   */
  onConfirm(): void {
    this.markAsShown();
    this.closeEvent.emit();
  }

  // === STORAGE HELPERS ===

  shouldShowForProject(projectId: number, step: WorkflowStep): boolean {
    const stepName = STEP_INFO_NAMES[step];
    if (!stepName) return false;
    return !this.storage.isStepInfoShown(projectId, stepName);
  }

  private markAsShown(): void {
    const pid = this.projectId();
    const stepName = STEP_INFO_NAMES[this.step()];
    if (pid && stepName) {
      this.storage.setStepInfoShown(pid, stepName);
    }
  }

  resetShownStatus(projectId: number, step?: WorkflowStep): void {
    if (step) {
      const stepName = STEP_INFO_NAMES[step];
      if (stepName) {
        this.storage.resetStepInfoShown(projectId, stepName);
      }
    } else {
      this.storage.resetAllStepInfoShown(projectId);
    }
  }
}
