import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
  ElementRef,
  AfterViewInit,
  DestroyRef,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import {
  DialogHeaderStyle,
  DialogTheme,
  DialogSize,
  DialogFooterAlign,
  DialogVariant,
  DIALOG_THEMES,
  DIALOG_SIZES,
} from './dialog-wrapper.types';

@Component({
  selector: 'app-dialog-wrapper',
  imports: [LucideAngularModule],
  templateUrl: './dialog-wrapper.component.html',
  styleUrls: ['./dialog-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscapeKey($event)',
    '(document:keydown.enter)': 'handleEnterKey($event)',
  }
})
export class DialogWrapperComponent implements AfterViewInit {
  // === INPUTS ===
  readonly headerStyle = input<DialogHeaderStyle>('flat');
  readonly theme = input<DialogTheme>('blue');
  readonly icon = input<string>('');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly size = input<DialogSize>('md');
  readonly columns = input<1 | 2>(1);
  readonly footerAlign = input<DialogFooterAlign>('end');
  readonly closable = input<boolean>(true);
  readonly showCloseButton = input<boolean | undefined>(undefined);
  readonly isSubmitting = input<boolean>(false);
  readonly variant = input<DialogVariant | undefined>(undefined);
  readonly errorMessage = input<string | null>(null);

  // === OUTPUTS ===
  readonly closeEvent = output<void>();
  readonly backdropClickEvent = output<void>();
  readonly submitEvent = output<void>();

  // === COMPUTED ===
  readonly themeColors = computed(() => DIALOG_THEMES[this.theme()]);
  readonly maxWidth = computed(() => DIALOG_SIZES[this.size()]);
  readonly shouldShowCloseButton = computed(() => {
    const explicit = this.showCloseButton();
    return explicit !== undefined ? explicit : this.closable();
  });

  readonly ICONS = ICONS;

  // === INTERNALS ===
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private mouseDownOnBackdrop = false;
  private scrollPosition = 0;
  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.unlockBodyScroll();
      if (this.previousActiveElement?.focus) {
        setTimeout(() => this.previousActiveElement?.focus(), 100);
      }
    });
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngAfterViewInit(): void {
    this.lockBodyScroll();
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.focusFirstInput();
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

  protected handleEscapeKey(event: Event): void {
    if (this.closable() && !this.isSubmitting()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closeEvent.emit();
    }
  }

  protected handleEnterKey(event: Event): void {
    if (this.isSubmitting()) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA') return;
    this.submitEvent.emit();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.mouseDownOnBackdrop = target.classList.contains('dw-backdrop');
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isBackdrop = target.classList.contains('dw-backdrop');

    if (!this.isSubmitting() && isBackdrop && this.mouseDownOnBackdrop) {
      if (this.closable()) {
        this.closeEvent.emit();
      }
      this.backdropClickEvent.emit();
    }
    this.mouseDownOnBackdrop = false;
  }
}
