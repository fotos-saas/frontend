import {
  Component,
  AfterViewInit,
  OnDestroy,
  output,
  HostListener,
  ElementRef,
  inject,
  signal
} from '@angular/core';

/**
 * Abstract Base Dialog Component
 *
 * Közös dialógus funkcionalitás:
 * - Body scroll lock (Safari kompatibilis)
 * - Focus trap és restore
 * - ESC billentyű kezelés
 * - Backdrop kattintás kezelés
 * - Állapot management (isSubmitting, errorMessage)
 *
 * Használat:
 * ```typescript
 * @Component({...})
 * export class MyDialogComponent extends BaseDialogComponent {
 *   protected onSubmit(): void {
 *     // Submit logika
 *   }
 *
 *   protected onClose(): void {
 *     // Close logika
 *   }
 * }
 * ```
 */
@Component({
  template: ''
})
export abstract class BaseDialogComponent implements AfterViewInit, OnDestroy {
  /** Signal-based outputs */
  readonly dialogCloseEvent = output<void>();

  /** Állapotok - belső signal-ok */
  protected readonly _isSubmitting = signal<boolean>(false);
  protected readonly _errorMessage = signal<string | null>(null);

  /** isSubmitting signal getter */
  get isSubmitting() {
    return this._isSubmitting;
  }

  /** errorMessage signal getter */
  get errorMessage() {
    return this._errorMessage;
  }

  /** ElementRef a dialog container-hez */
  protected readonly elementRef = inject(ElementRef);

  /** Előző fókuszált elem (visszaállításhoz) */
  private previousActiveElement: HTMLElement | null = null;

  /** Scroll pozíció (body lock-hoz) */
  private scrollPosition = 0;

  /** Mousedown a backdropon történt-e (kijelölés közbeni bezárás megelőzéséhez) */
  private mouseDownOnBackdrop = false;

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  ngAfterViewInit(): void {
    this.lockBodyScroll();
    this.savePreviousFocus();
    this.focusFirstInput();
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
    this.restorePreviousFocus();
  }

  // ============================================================================
  // BODY SCROLL LOCK (Safari kompatibilis)
  // ============================================================================

  /**
   * Body scroll blokkolása dialog megnyitásakor
   * Safari-n position: fixed + CSS változóval mentett scroll pozíció
   */
  protected lockBodyScroll(): void {
    this.scrollPosition = window.scrollY;
    document.body.style.setProperty('--scroll-position', `-${this.scrollPosition}px`);
    document.body.classList.add('dialog-open');
  }

  /**
   * Body scroll visszaállítása dialog bezárásakor
   */
  protected unlockBodyScroll(): void {
    document.body.classList.remove('dialog-open');
    document.body.style.removeProperty('--scroll-position');
    window.scrollTo(0, this.scrollPosition);
  }

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  /**
   * Előző fókuszált elem mentése
   */
  protected savePreviousFocus(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;
  }

  /**
   * Focus visszaállítása az előző elemre
   */
  protected restorePreviousFocus(): void {
    if (this.previousActiveElement?.focus) {
      setTimeout(() => {
        this.previousActiveElement?.focus();
      }, 100);
    }
  }

  /**
   * Focus az első input elemre a dialogban
   * Override-olható ha speciális elem kell
   */
  protected focusFirstInput(): void {
    setTimeout(() => {
      const firstInput = this.elementRef.nativeElement.querySelector(
        'input:not([type="hidden"]), textarea, select, [contenteditable="true"]'
      );
      if (firstInput) {
        (firstInput as HTMLElement).focus();
      }
    }, 100);
  }

  // ============================================================================
  // KEYBOARD & MOUSE EVENTS
  // ============================================================================

  /**
   * ESC billentyű kezelés
   */
  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscapeKey(event: Event): void {
    if (!this._isSubmitting()) {
      event.preventDefault();
      this.close();
    }
  }

  /**
   * Backdrop mousedown kezelés
   * Megjegyezzük, hogy a mousedown a backdropon történt-e
   * (kijelölés közbeni véletlen bezárás megelőzéséhez)
   */
  onBackdropMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.mouseDownOnBackdrop = target.classList.contains('dialog-backdrop') ||
                                target.classList.contains('dialog-overlay');
  }

  /**
   * Backdrop kattintás kezelés
   * A child komponensben a template-ben hívható:
   * (mousedown)="onBackdropMouseDown($event)" (click)="onBackdropClick($event)"
   *
   * Csak akkor zárjuk be, ha a mousedown ÉS a click is a backdropon történt
   * (így szöveg kijelölés közben kihúzva az egeret nem záródik be)
   */
  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isBackdrop = target.classList.contains('dialog-backdrop') ||
                       target.classList.contains('dialog-overlay');

    if (!this._isSubmitting() && isBackdrop && this.mouseDownOnBackdrop) {
      this.close();
    }

    // Reset flag
    this.mouseDownOnBackdrop = false;
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Dialog bezárása
   * Override-olható a child-ban ha extra logika kell
   */
  close(): void {
    if (!this._isSubmitting()) {
      this.restorePreviousFocus();
      this.onClose();
    }
  }

  /**
   * Submit indítása
   * Beállítja az isSubmitting state-et és hívja az onSubmit-ot
   */
  submit(): void {
    if (this._isSubmitting()) return;

    this._isSubmitting.set(true);
    this._errorMessage.set(null);
    this.onSubmit();
  }

  /**
   * Submit befejezése (success)
   */
  protected submitSuccess(): void {
    this._isSubmitting.set(false);
    this.restorePreviousFocus();
  }

  /**
   * Submit befejezése (error)
   */
  protected submitError(message: string): void {
    this._isSubmitting.set(false);
    this._errorMessage.set(message);
  }

  /**
   * Error üzenet törlése (pl. input change-kor)
   */
  clearError(): void {
    this._errorMessage.set(null);
  }

  // ============================================================================
  // ABSTRACT METHODS - Child komponensek implementálják
  // ============================================================================

  /**
   * Submit logika implementálása
   * A child komponensben ez végzi az API hívást
   */
  protected abstract onSubmit(): void;

  /**
   * Close logika implementálása
   * A child komponensben ez emittálja a result/close eventet
   */
  protected abstract onClose(): void;
}
