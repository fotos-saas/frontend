import {
  Directive,
  ElementRef,
  OnInit,
  DestroyRef,
  inject,
  input,
  Renderer2,
  PLATFORM_ID,
  afterNextRender,
  signal,
} from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { isPlatformBrowser } from '@angular/common';

/**
 * LazyImage Directive
 *
 * Intersection Observer API alapú lazy loading direktíva képekhez.
 * A kép src attribútuma csak akkor kerül a DOM-ba, amikor a kép
 * megközelíti a viewport-ot.
 *
 * Használat:
 *   <img appLazyImage [lazySrc]="imageUrl" [lazyAlt]="altText" />
 *
 * Opcionális paraméterek:
 *   - threshold: Intersection Observer threshold (default: 0.1)
 *   - rootMargin: Intersection Observer rootMargin (default: "100px")
 *   - placeholderClass: Skeleton placeholder CSS class (default: "lazy-image-skeleton")
 *
 * Fallback: Ha az Intersection Observer API nem támogatott,
 * automatikusan native loading="lazy" attribútumot használ.
 */
@Directive({
  selector: '[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly elementRef = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** A betöltendő kép URL-je */
  readonly lazySrc = input.required<string>();

  /** Alt text a képhez */
  readonly lazyAlt = input<string>('');

  /** Intersection Observer threshold (0-1) */
  readonly threshold = input<number>(0.1);

  /** Intersection Observer rootMargin */
  readonly rootMargin = input<string>('100px');

  /** Placeholder CSS class */
  readonly placeholderClass = input<string>('lazy-image-skeleton');

  private observer: IntersectionObserver | null = null;
  private readonly isLoaded = signal(false);
  private wrapperElement: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      this.initLazyLoading();
    });

    this.destroyRef.onDestroy(() => {
      this.disconnectObserver();
      this.removePlaceholder();
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupPlaceholder();
  }

  private setupPlaceholder(): void {
    const imgElement = this.elementRef.nativeElement;

    // Wrapper elem létrehozása a skeleton placeholder-hez
    this.wrapperElement = this.renderer.createElement('div');
    this.renderer.addClass(this.wrapperElement, 'lazy-image-wrapper');

    // Skeleton placeholder hozzáadása
    const skeleton = this.renderer.createElement('div');
    this.renderer.addClass(skeleton, this.placeholderClass());
    this.renderer.addClass(skeleton, 'skeleton-shimmer');

    // Parent elem megkeresése és wrapper beillesztése
    const parent = imgElement.parentElement;
    if (parent) {
      this.renderer.insertBefore(parent, this.wrapperElement, imgElement);
      this.renderer.appendChild(this.wrapperElement, skeleton);
      this.renderer.appendChild(this.wrapperElement, imgElement);
    }

    // Kép elrejtése amíg nem töltődik be
    this.renderer.setStyle(imgElement, 'opacity', '0');
    this.renderer.setStyle(imgElement, 'transition', 'opacity 0.3s ease');

    // Alt text beállítása
    if (this.lazyAlt()) {
      this.renderer.setAttribute(imgElement, 'alt', this.lazyAlt());
    }
  }

  private initLazyLoading(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const imgElement = this.elementRef.nativeElement;

    // Intersection Observer támogatás ellenőrzése
    if (!('IntersectionObserver' in window)) {
      this.useFallback(imgElement);
      return;
    }

    this.createObserver(imgElement);
  }

  private createObserver(imgElement: HTMLImageElement): void {
    const options: IntersectionObserverInit = {
      threshold: this.threshold(),
      rootMargin: this.rootMargin(),
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(imgElement);
          this.disconnectObserver();
        }
      });
    }, options);

    this.observer.observe(imgElement);
  }

  private loadImage(imgElement: HTMLImageElement): void {
    const src = this.lazySrc();

    if (!src) {
      return;
    }

    // Kép betöltés eseménykezelő
    const onLoad = (): void => {
      this.isLoaded.set(true);
      this.showImage(imgElement);
      imgElement.removeEventListener('load', onLoad);
      imgElement.removeEventListener('error', onError);
    };

    const onError = (): void => {
      this.logger.warn('[LazyImageDirective] Kép betöltési hiba: ' + src);
      this.showImage(imgElement);
      imgElement.removeEventListener('load', onLoad);
      imgElement.removeEventListener('error', onError);
    };

    imgElement.addEventListener('load', onLoad);
    imgElement.addEventListener('error', onError);

    // src attribútum beállítása - ez indítja a betöltést
    this.renderer.setAttribute(imgElement, 'src', src);
  }

  private showImage(imgElement: HTMLImageElement): void {
    // Skeleton elrejtése
    if (this.wrapperElement) {
      const skeleton = this.wrapperElement.querySelector(`.${this.placeholderClass()}`);
      if (skeleton) {
        this.renderer.setStyle(skeleton, 'opacity', '0');
        this.renderer.setStyle(skeleton, 'position', 'absolute');
      }
    }

    // Kép megjelenítése fade-in animációval
    this.renderer.setStyle(imgElement, 'opacity', '1');
  }

  private useFallback(imgElement: HTMLImageElement): void {
    // Native lazy loading használata fallback-ként
    this.renderer.setAttribute(imgElement, 'loading', 'lazy');
    this.renderer.setAttribute(imgElement, 'src', this.lazySrc());

    // Skeleton eltávolítása native lazy esetén
    this.removePlaceholder();
    this.renderer.setStyle(imgElement, 'opacity', '1');
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private removePlaceholder(): void {
    if (this.wrapperElement) {
      const imgElement = this.elementRef.nativeElement;
      const parent = this.wrapperElement.parentElement;

      if (parent) {
        // Kép visszahelyezése eredeti pozícióba
        this.renderer.insertBefore(parent, imgElement, this.wrapperElement);
        this.renderer.removeChild(parent, this.wrapperElement);
      }

      this.wrapperElement = null;
    }
  }
}
