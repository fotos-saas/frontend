import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';
import { WorkflowStep, getStepInfo, STEP_INFO_NAMES } from '../../models/workflow.models';
import { TabloStorageService } from '../../../../core/services/tablo-storage.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Step Info Dialog Component
 *
 * Modal dialógus, amely elmagyarázza az aktuális lépést.
 * localStorage tracking - csak első megnyitáskor jelenik meg.
 */
@Component({
  selector: 'app-step-info-dialog',
  standalone: true,
  imports: [],
  template: `
    <div
      class="step-info-dialog__backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
      role="presentation"
    >
      <div
        #dialogContent
        class="step-info-dialog__content"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'step-info-title'"
        [attr.aria-describedby]="'step-info-description'"
      >
        <!-- Icon -->
        <div class="step-info-dialog__icon">
          @switch (step()) {
            @case ('claiming') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            }
            @case ('retouch') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            }
            @case ('tablo') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            }
            @default {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
          }
        </div>

        <!-- Title -->
        <h2 id="step-info-title" class="step-info-dialog__title">
          {{ stepInfo?.infoDialogTitle || 'Információ' }}
        </h2>

        <!-- Message -->
        <p id="step-info-description" class="step-info-dialog__message">
          {{ customMessage() || stepInfo?.infoDialogMessage || '' }}
        </p>

        <!-- Additional info for retouch -->
        @if (step() === 'retouch' && maxPhotos()) {
          <div class="step-info-dialog__highlight">
            Maximum <strong>{{ maxPhotos() }}</strong> képet választhatsz.
          </div>
        }

        <!-- Action button -->
        <button
          type="button"
          class="step-info-dialog__button"
          (click)="onConfirm()"
          #confirmButton
        >
          Megértettem
        </button>
      </div>
    </div>
  `,
  styleUrl: './step-info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepInfoDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('confirmButton') confirmButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLDivElement>;

  private readonly storage = inject(TabloStorageService);

  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.onConfirm(), 'step-info-dialog__backdrop');

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

  /** Lépés információk */
  get stepInfo() {
    return getStepInfo(this.step());
  }

  /** Body scroll position (restore-hoz) */
  private scrollPosition = 0;

  /** Focus trap - focusable elemek */
  private focusableElements: HTMLElement[] = [];

  // === KEYBOARD HANDLERS (A11y) ===

  /**
   * ESC billentyű bezárás (A11y javítás)
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: Event): void {
    event.preventDefault();
    this.onConfirm();
  }

  /**
   * Tab billentyű kezelés (Focus trap - A11y javítás)
   */
  @HostListener('document:keydown.tab', ['$event'])
  onTabPress(event: Event): void {
    if (event instanceof KeyboardEvent) {
      this.handleFocusTrap(event);
    }
  }

  ngAfterViewInit(): void {
    // Body scroll lock
    this.lockBodyScroll();

    // Focusable elemek gyűjtése
    this.collectFocusableElements();

    // Initial focus a gombra
    requestAnimationFrame(() => {
      this.confirmButton?.nativeElement?.focus();
    });
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  /**
   * Megértettem gombra kattintás
   */
  onConfirm(): void {
    // localStorage-ba mentjük, hogy látott dialog-ot
    this.markAsShown();
    this.closeEvent.emit();
  }

  // === STORAGE HELPERS ===

  /**
   * Ellenőrzi, hogy meg kell-e jeleníteni a dialógust
   * Projekt-specifikus storage-t használ
   */
  shouldShowForProject(projectId: number, step: WorkflowStep): boolean {
    const stepName = STEP_INFO_NAMES[step];
    if (!stepName) return false;

    return !this.storage.isStepInfoShown(projectId, stepName);
  }

  /**
   * Jelöli, hogy a dialógus megjelent
   */
  private markAsShown(): void {
    const pid = this.projectId();
    const stepName = STEP_INFO_NAMES[this.step()];

    if (pid && stepName) {
      this.storage.setStepInfoShown(pid, stepName);
    }
  }

  /**
   * Reset - újra mutatja a dialógust (debug)
   */
  resetShownStatus(projectId: number, step?: WorkflowStep): void {
    if (step) {
      const stepName = STEP_INFO_NAMES[step];
      if (stepName) {
        this.storage.resetStepInfoShown(projectId, stepName);
      }
    } else {
      // Összes
      this.storage.resetAllStepInfoShown(projectId);
    }
  }

  // === BODY SCROLL LOCK (Safari kompatibilis) ===

  private lockBodyScroll(): void {
    this.scrollPosition = window.scrollY;
    document.body.style.setProperty('--scroll-position', `-${this.scrollPosition}px`);
    document.body.classList.add('dialog-open');
  }

  private unlockBodyScroll(): void {
    document.body.classList.remove('dialog-open');
    document.body.style.removeProperty('--scroll-position');
    window.scrollTo(0, this.scrollPosition);
  }

  // === FOCUS TRAP (A11y javítás) ===

  /**
   * Focusable elemek gyűjtése a dialógusból
   */
  private collectFocusableElements(): void {
    if (!this.dialogContent?.nativeElement) return;

    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    this.focusableElements = Array.from(
      this.dialogContent.nativeElement.querySelectorAll<HTMLElement>(selector)
    );
  }

  /**
   * Focus trap kezelés - Tab billentyűvel ne lehessen kilépni
   */
  private handleFocusTrap(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    // Shift+Tab az első elemről → ugrás az utolsóra
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab az utolsó elemről → ugrás az elsőre
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}
