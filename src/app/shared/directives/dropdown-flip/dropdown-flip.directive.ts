import {
  Directive,
  ElementRef,
  DestroyRef,
  inject,
  input,
  signal,
  afterNextRender,
  Renderer2,
  NgZone,
} from '@angular/core';

const FLIP_CLASS = 'ps-dropdown--flip-up';
const CONTAINER_FLIP_CLASS = 'ps-dropdown-container--flip-up';

@Directive({
  selector: '[psDropdownFlip]',
  standalone: true,
})
export class DropdownFlipDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  /** Minimum terkoz a viewport szelehez (px) */
  readonly flipPadding = input(8);

  /** Kiolvashato signal a flip allapotrol */
  readonly isFlipped = signal(false);

  private scrollCleanup: (() => void) | null = null;
  private resizeCleanup: (() => void) | null = null;
  private rafId = 0;

  constructor() {
    afterNextRender(() => {
      this.calculatePosition();
      this.setupListeners();
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private calculatePosition(): void {
    const panel = this.el.nativeElement;
    if (!panel) return;

    // A szulo elem (pl. .ps-select, .ps-datepicker) a position:relative container
    const container = panel.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const viewportHeight = window.innerHeight;
    const padding = this.flipPadding();

    const spaceBelow = viewportHeight - containerRect.bottom - padding;
    const spaceAbove = containerRect.top - padding;

    const shouldFlip = panelHeight > spaceBelow && spaceAbove > spaceBelow;

    if (shouldFlip !== this.isFlipped()) {
      this.isFlipped.set(shouldFlip);

      if (shouldFlip) {
        this.renderer.addClass(panel, FLIP_CLASS);
        if (container) this.renderer.addClass(container, CONTAINER_FLIP_CLASS);
      } else {
        this.renderer.removeClass(panel, FLIP_CLASS);
        if (container) this.renderer.removeClass(container, CONTAINER_FLIP_CLASS);
      }
    }
  }

  private setupListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      const onScrollOrResize = (): void => {
        if (this.rafId) return;
        this.rafId = requestAnimationFrame(() => {
          this.rafId = 0;
          this.calculatePosition();
        });
      };

      window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });

      this.scrollCleanup = () =>
        window.removeEventListener('scroll', onScrollOrResize, { capture: true } as EventListenerOptions);
      this.resizeCleanup = () =>
        window.removeEventListener('resize', onScrollOrResize);
    });
  }

  private cleanup(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.scrollCleanup?.();
    this.resizeCleanup?.();
  }
}
