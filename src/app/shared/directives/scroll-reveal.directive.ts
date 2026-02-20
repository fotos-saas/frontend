import { Directive, ElementRef, inject, AfterViewInit, DestroyRef, input } from '@angular/core';

/**
 * Scroll-reveal animáció direktíva
 *
 * IntersectionObserver-rel figyeli a szekció láthatóságát.
 * Megjelenéskor: opacity 0→1 + translateY(30px)→0 animáció.
 * prefers-reduced-motion esetén azonnal megjelenik.
 *
 * @example
 * <section appScrollReveal>...</section>
 * <section appScrollReveal [revealDelay]="200">...</section>
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements AfterViewInit {
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Késleltetés ms-ben */
  readonly revealDelay = input(0);

  ngAfterViewInit(): void {
    const element = this.el.nativeElement as HTMLElement;

    // prefers-reduced-motion — azonnal megjelenik
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      element.style.opacity = '1';
      return;
    }

    // Kezdeti állapot
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    const delay = this.revealDelay();
    if (delay > 0) {
      element.style.transitionDelay = `${delay}ms`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);

    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
