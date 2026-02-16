import {
  Directive,
  ElementRef,
  DestroyRef,
  inject,
  AfterViewInit,
  NgZone,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

/**
 * DragScrollDirective
 *
 * Horizontális drag-to-scroll + kétoldali fade árnyék.
 * Mobilon ujjal, desktopon egérrel húzva scrollozható.
 * Aktív elem (activeSelector) automatikusan középre scrollozódik.
 *
 * Használat:
 *   <nav class="tabs-nav" appDragScroll activeSelector=".tab-btn--active">
 *     <button class="tab-btn" [class.tab-btn--active]="...">Tab</button>
 *   </nav>
 */
@Directive({
  selector: '[appDragScroll]',
  standalone: true,
})
export class DragScrollDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  /** CSS selector az aktív elemhez (automatikus scroll center) */
  readonly activeSelector = input<string>('.tab-btn--active');

  private isDragging = false;
  private startX = 0;
  private scrollStartLeft = 0;
  private hasMoved = false;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const host = this.el.nativeElement;
    this.applyHostStyles(host);

    this.zone.runOutsideAngular(() => {
      // Drag scroll
      host.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);

      // Scroll → frissíti a fade mask-ot
      host.addEventListener('scroll', this.updateMask, { passive: true });

      // Click prevention drag közben
      host.addEventListener('click', this.onClickCapture, true);

      // Resize → mask újraszámolás
      this.resizeObserver = new ResizeObserver(() => this.updateMask());
      this.resizeObserver.observe(host);

      // MutationObserver → aktív tab változás figyelése
      this.mutationObserver = new MutationObserver(() => {
        this.scrollActiveToCenter();
        this.updateMask();
      });
      this.mutationObserver.observe(host, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
      });
    });

    // Kezdeti scroll + mask
    requestAnimationFrame(() => {
      this.scrollActiveToCenter(false);
      this.updateMask();
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private applyHostStyles(host: HTMLElement): void {
    host.style.overflowX = 'auto';
    (host.style as any)['-webkit-overflow-scrolling'] = 'touch';
    host.style.scrollbarWidth = 'none';
    // -webkit-mask-image az oldalsó fade-hez — frissül dinamikusan
  }

  /**
   * CSS mask-image-gel kétoldali fade.
   * Ha nem scrollozható, nincs mask.
   */
  private readonly updateMask = (): void => {
    const host = this.el.nativeElement;
    const { scrollLeft, scrollWidth, clientWidth } = host;

    const isScrollable = scrollWidth > clientWidth + 2;
    if (!isScrollable) {
      host.style.maskImage = '';
      host.style.webkitMaskImage = '';
      return;
    }

    const canScrollLeft = scrollLeft > 2;
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 2;

    const fadeSize = 24; // px

    if (canScrollLeft && canScrollRight) {
      // Mindkét oldal fade
      const mask = `linear-gradient(to right, transparent, black ${fadeSize}px, black calc(100% - ${fadeSize}px), transparent)`;
      host.style.maskImage = mask;
      host.style.webkitMaskImage = mask;
    } else if (canScrollLeft) {
      // Csak bal fade
      const mask = `linear-gradient(to right, transparent, black ${fadeSize}px)`;
      host.style.maskImage = mask;
      host.style.webkitMaskImage = mask;
    } else if (canScrollRight) {
      // Csak jobb fade
      const mask = `linear-gradient(to left, transparent, black ${fadeSize}px)`;
      host.style.maskImage = mask;
      host.style.webkitMaskImage = mask;
    } else {
      host.style.maskImage = '';
      host.style.webkitMaskImage = '';
    }
  };

  /**
   * Aktív elem scrollozása a container közepére
   */
  private scrollActiveToCenter(smooth = true): void {
    const host = this.el.nativeElement;
    const selector = this.activeSelector();
    const active = host.querySelector(selector) as HTMLElement | null;
    if (!active) return;

    const hostRect = host.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    // Elem közepe - container közepe = scroll offset
    const activeCenter = activeRect.left + activeRect.width / 2;
    const hostCenter = hostRect.left + hostRect.width / 2;
    const scrollDelta = activeCenter - hostCenter;

    host.scrollBy({
      left: scrollDelta,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }

  // --- Drag scroll ---

  private readonly onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const host = this.el.nativeElement;
    if (host.scrollWidth <= host.clientWidth) return;

    this.isDragging = true;
    this.hasMoved = false;
    this.startX = e.pageX;
    this.scrollStartLeft = host.scrollLeft;
    host.style.cursor = 'grab';
    host.style.userSelect = 'none';
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const host = this.el.nativeElement;
    const walk = (e.pageX - this.startX) * 1.5;

    if (Math.abs(e.pageX - this.startX) > 3) {
      this.hasMoved = true;
      host.style.cursor = 'grabbing';
    }

    host.scrollLeft = this.scrollStartLeft - walk;
  };

  private readonly onMouseUp = (): void => {
    if (!this.isDragging) return;
    this.isDragging = false;
    const host = this.el.nativeElement;
    host.style.cursor = '';
    host.style.userSelect = '';
  };

  private readonly onClickCapture = (e: MouseEvent): void => {
    if (this.hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      this.hasMoved = false;
    }
  };

  private cleanup(): void {
    const host = this.el.nativeElement;
    host.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    host.removeEventListener('scroll', this.updateMask);
    host.removeEventListener('click', this.onClickCapture, true);
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}
