import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import {
  HeroDialogTheme,
  HeroDialogSize,
  HERO_DIALOG_THEMES,
  HERO_DIALOG_SIZES,
} from './hero-dialog-wrapper.types';

/**
 * Hero Dialog Wrapper
 *
 * Újrahasználható "hero" stílusú dialógus shell.
 * Gradient header + nagy ikon + cím + leírás + content projection.
 *
 * Tartalmazza:
 * - Body scroll lock (Safari kompatibilis)
 * - ESC kezelés
 * - Backdrop kattintás (szöveg kijelölés biztonságos)
 * - Focus management
 * - Submitting/error state
 *
 * Használat:
 * ```html
 * <app-hero-dialog-wrapper
 *   theme="purple"
 *   icon="message-circle"
 *   title="Új beszélgetés"
 *   description="Indíts új témát."
 *   size="lg"
 *   [isSubmitting]="isSubmitting()"
 *   [errorMessage]="errorMessage()"
 *   (closeEvent)="onClose()"
 * >
 *   <ng-container dialogBody>
 *     <!-- form mezők -->
 *   </ng-container>
 *   <ng-container dialogFooter>
 *     <!-- gombok -->
 *   </ng-container>
 * </app-hero-dialog-wrapper>
 * ```
 */
@Component({
  selector: 'app-hero-dialog-wrapper',
  imports: [LucideAngularModule],
  templateUrl: './hero-dialog-wrapper.component.html',
  styleUrls: ['./hero-dialog-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDialogWrapperComponent implements AfterViewInit, OnDestroy {
  // === INPUTS ===
  readonly theme = input<HeroDialogTheme>('blue');
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly size = input<HeroDialogSize>('lg');
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  /** Bezárható-e a dialog (X gomb, ESC, backdrop) - default true */
  readonly closable = input<boolean>(true);
  /** X gomb megjelenítése - default: closable értéke */
  readonly showCloseButton = input<boolean | undefined>(undefined);

  // === OUTPUTS ===
  readonly closeEvent = output<void>();
  /** Backdrop kattintás külön event (speciális kezeléshez, pl. reminder dialógusok) */
  readonly backdropClickEvent = output<void>();

  // === COMPUTED ===
  readonly themeColors = computed(() => HERO_DIALOG_THEMES[this.theme()]);
  readonly maxWidth = computed(() => HERO_DIALOG_SIZES[this.size()]);
  readonly shouldShowCloseButton = computed(() => {
    const explicit = this.showCloseButton();
    return explicit !== undefined ? explicit : this.closable();
  });

  readonly ICONS = ICONS;

  // === INTERNALS ===
  private readonly elementRef = inject(ElementRef);
  private mouseDownOnBackdrop = false;
  private scrollPosition = 0;
  private previousActiveElement: HTMLElement | null = null;

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngAfterViewInit(): void {
    this.lockBodyScroll();
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.focusFirstInput();
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
    if (this.previousActiveElement?.focus) {
      setTimeout(() => this.previousActiveElement?.focus(), 100);
    }
  }

  // ============================================================================
  // BODY SCROLL LOCK (Safari kompatibilis)
  // ============================================================================

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

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  private focusFirstInput(): void {
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

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscapeKey(event: Event): void {
    if (this.closable() && !this.isSubmitting()) {
      event.preventDefault();
      this.closeEvent.emit();
    }
  }

  onBackdropMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.mouseDownOnBackdrop = target.classList.contains('hero-dialog-backdrop');
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isBackdrop = target.classList.contains('hero-dialog-backdrop');

    if (!this.isSubmitting() && isBackdrop && this.mouseDownOnBackdrop) {
      if (this.closable()) {
        this.closeEvent.emit();
      }
      // Mindig emittáljuk a backdrop click eventet (reminder dialógusoknak)
      this.backdropClickEvent.emit();
    }
    this.mouseDownOnBackdrop = false;
  }
}
