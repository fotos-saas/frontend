import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  input,
  Renderer2,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Stagger Animation Directive
 *
 * Optimalizált staggered entry animáció nagy listákhoz.
 * Performance-tudatos: csak az első 30 elemre alkalmaz animációt,
 * a többi elem azonnal megjelenik.
 *
 * Használat:
 *   @for (item of items(); track item.id; let i = $index) {
 *     <div appStaggerAnimation [staggerIndex]="i" [staggerTotal]="items().length">
 *       {{ item.name }}
 *     </div>
 *   }
 *
 * Opcionális paraméterek:
 *   - staggerIndex: Az elem indexe a listában (kötelező)
 *   - staggerTotal: A lista teljes hossza (opcionális, animáció kikapcsolásához 30+ elem esetén)
 *   - staggerDelay: Késleltetés elemek között ms-ban (default: 50)
 *   - staggerMaxItems: Maximum animált elemek száma (default: 30)
 *   - staggerDuration: Animáció időtartama ms-ban (default: 400)
 *   - staggerDisabled: Animáció manuális kikapcsolása (pl. virtual scroll újrarendereléskor)
 *
 * Virtual scroll kompatibilitás:
 *   - Állítsd be staggerDisabled=true az újrarenderelt elemeknél
 *   - Vagy használj trackBy-t a komponensben
 *
 * A11y:
 *   - Automatikusan figyeli a prefers-reduced-motion beállítást
 *   - Reduced motion esetén azonnal megjelenik minden elem
 */
@Directive({
  selector: '[appStaggerAnimation]',
  standalone: true,
})
export class StaggerAnimationDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  /** Az elem indexe a listában (0-tól kezdve) */
  readonly staggerIndex = input.required<number>();

  /** A lista teljes hossza (opcionális, 30+ elemnél kikapcsolja az animációt) */
  readonly staggerTotal = input<number | undefined>(undefined);

  /** Késleltetés elemek között (ms) */
  readonly staggerDelay = input<number>(50);

  /** Maximum animált elemek száma */
  readonly staggerMaxItems = input<number>(30);

  /** Animáció időtartama (ms) */
  readonly staggerDuration = input<number>(400);

  /** Animáció manuális kikapcsolása (pl. virtual scroll esetén) */
  readonly staggerDisabled = input<boolean>(false);

  private mediaQueryList: MediaQueryList | null = null;
  private reducedMotion = false;
  private animationApplied = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR esetén azonnal látható
      this.showImmediately();
      return;
    }

    this.checkReducedMotion();
    this.applyAnimation();
  }

  ngOnDestroy(): void {
    this.cleanupMediaQueryListener();
  }

  /**
   * Ellenőrzi a felhasználó reduced motion beállítását
   */
  private checkReducedMotion(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.mediaQueryList.matches;

    // Listener hozzáadása a beállítás változásához
    // Safari kompatibilis: addEventListener használata addListener helyett
    try {
      this.mediaQueryList.addEventListener('change', this.handleMotionPreferenceChange);
    } catch {
      // Régebbi böngészők fallback
      this.mediaQueryList.addListener(this.handleMotionPreferenceChange);
    }
  }

  /**
   * Kezeli a motion preference változását
   */
  private handleMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;

    // Ha már fut az animáció és most kapcsolták be a reduced motion-t
    if (this.reducedMotion && this.animationApplied) {
      this.showImmediately();
    }
  };

  /**
   * Alkalmazza a staggered animációt
   */
  private applyAnimation(): void {
    const element = this.elementRef.nativeElement;
    const index = this.staggerIndex();
    const total = this.staggerTotal();
    const maxItems = this.staggerMaxItems();
    const isDisabled = this.staggerDisabled();

    // Animáció kikapcsolása ha:
    // 1. Manuálisan ki van kapcsolva (pl. virtual scroll újrarenderelés)
    // 2. Reduced motion van beállítva
    // 3. A lista túl hosszú (total > maxItems és nincs megadva total)
    // 4. Az index túl magas (> maxItems)
    const shouldSkipAnimation =
      isDisabled ||
      this.reducedMotion ||
      (total !== undefined && total > maxItems) ||
      index >= maxItems;

    if (shouldSkipAnimation) {
      this.showImmediately();
      return;
    }

    // Animáció alkalmazása
    this.animationApplied = true;
    const delay = index * this.staggerDelay();
    const duration = this.staggerDuration();

    // Kezdeti állapot: rejtett
    this.renderer.setStyle(element, 'opacity', '0');
    this.renderer.setStyle(element, 'transform', 'translateY(20px)');

    // will-change hint a GPU-nak (performance optimalizáció)
    // Csak rövid időre, hogy ne pazaroljuk a memóriát
    this.renderer.setStyle(element, 'will-change', 'opacity, transform');

    // Animáció indítása késleltetéssel
    // requestAnimationFrame használata a frame sync-hez (60fps)
    requestAnimationFrame(() => {
      // Transition beállítása
      this.renderer.setStyle(
        element,
        'transition',
        `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`
      );

      // Végállapot beállítása - a transition automatikusan animálja
      requestAnimationFrame(() => {
        this.renderer.setStyle(element, 'opacity', '1');
        this.renderer.setStyle(element, 'transform', 'translateY(0)');

        // will-change eltávolítása az animáció végén
        const cleanupTime = delay + duration + 50;
        setTimeout(() => {
          if (element && element.style) {
            this.renderer.removeStyle(element, 'will-change');
            this.renderer.removeStyle(element, 'transition');
          }
        }, cleanupTime);
      });
    });
  }

  /**
   * Azonnali megjelenítés animáció nélkül
   */
  private showImmediately(): void {
    const element = this.elementRef.nativeElement;
    this.renderer.setStyle(element, 'opacity', '1');
    this.renderer.setStyle(element, 'transform', 'none');
    this.renderer.removeStyle(element, 'will-change');
    this.renderer.removeStyle(element, 'transition');
  }

  /**
   * Media query listener eltávolítása
   */
  private cleanupMediaQueryListener(): void {
    if (this.mediaQueryList) {
      try {
        this.mediaQueryList.removeEventListener('change', this.handleMotionPreferenceChange);
      } catch {
        // Régebbi böngészők fallback
        this.mediaQueryList.removeListener(this.handleMotionPreferenceChange);
      }
      this.mediaQueryList = null;
    }
  }
}
