import { Injectable, signal, NgZone, inject, WritableSignal } from '@angular/core';

/**
 * Breakpoint Service
 *
 * Dinamikus breakpoint kezelés ResizeObserver-rel.
 * Safari-kompatibilis, debounce-olt resize detection.
 *
 * Használat:
 * - observeElement() meghívása a figyelt container-rel és mobile mode signal-lal
 * - unobserve() meghívása a cleanup-hoz
 *
 * Hysteresis margin biztosítja, hogy ne vibráljon a layout desktop/mobile között váltáskor.
 */
@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  private ngZone = inject(NgZone);

  /** Hysteresis margó a vibrálás elkerülésére (px) */
  private readonly HYSTERESIS_MARGIN = 50;

  /** Debounce timeout (ms) */
  private readonly DEBOUNCE_DELAY = 50;

  /** Debounce timeout reference */
  private resizeDebounceTimeout?: ReturnType<typeof setTimeout>;

  /** Observer cache a cleanup-hoz */
  private observers = new Map<HTMLElement, ResizeObserver>();

  /** Utoljára mért desktop tartalom szélesség cache (per element) */
  private contentWidthCache = new Map<HTMLElement, number>();

  /**
   * Element megfigyelése és mobile mód állapot kezelése
   *
   * @param container - Navbar container (teljes szélesség)
   * @param desktopContent - Desktop tartalom (mérendő szélesség)
   * @param isMobileMode - WritableSignal a mobile mód állapotának kezelésére
   */
  observeElement(
    container: HTMLElement,
    desktopContent: HTMLElement,
    isMobileMode: WritableSignal<boolean>
  ): void {
    // Ha már van observer erre az elemre, ne hozzunk létre újat
    if (this.observers.has(container)) {
      return;
    }

    // Kezdeti mérés
    this.checkBreakpoint(container, desktopContent, isMobileMode);

    // ResizeObserver a container méretének figyelésére (debounce-olva)
    const observer = new ResizeObserver(() => {
      // Debounce: csak DEBOUNCE_DELAY ms inaktivitás után fut le
      if (this.resizeDebounceTimeout) {
        clearTimeout(this.resizeDebounceTimeout);
      }

      this.resizeDebounceTimeout = setTimeout(() => {
        // NgZone-on kívül fut, manuálisan kell a change detection-t triggerelni
        this.ngZone.run(() => {
          this.checkBreakpoint(container, desktopContent, isMobileMode);
        });
      }, this.DEBOUNCE_DELAY);
    });

    observer.observe(container);
    this.observers.set(container, observer);
  }

  /**
   * Ellenőrzi, hogy a desktop tartalom elfér-e a container-ben
   * Ha nem fér el, átkapcsol mobile módba
   * Hysteresis használata a vibrálás elkerülésére
   *
   * @param container - Navbar container
   * @param desktopContent - Desktop tartalom
   * @param isMobileMode - WritableSignal a mobile mód állapotának kezelésére
   */
  private checkBreakpoint(
    container: HTMLElement,
    desktopContent: HTMLElement,
    isMobileMode: WritableSignal<boolean>
  ): void {
    // Container szélessége
    const containerWidth = container.clientWidth;

    // Ha mobile módban vagyunk, a tartalmat el kell rejteni
    // Ilyenkor a cache-elt értéket használjuk a méréshez
    let contentWidth: number;
    const cachedWidth = this.contentWidthCache.get(desktopContent);

    if (isMobileMode()) {
      // Mobile módban - használjuk az utoljára mért értéket
      contentWidth = cachedWidth || 0;
    } else {
      // Desktop módban - mérjük meg a tényleges tartalmat
      contentWidth = desktopContent.scrollWidth;
      // Cache-eljük a mért értéket
      this.contentWidthCache.set(desktopContent, contentWidth);
    }

    // Hysteresis logika a vibrálás elkerülésére:
    // - Desktop → Mobile: ha tartalom túlnyúlik (contentWidth > containerWidth)
    // - Mobile → Desktop: csak ha van elég hely + hysteresis margó
    const currentlyMobile = isMobileMode();

    let shouldBeMobile: boolean;
    if (currentlyMobile) {
      // Mobile → Desktop váltáshoz több hely kell (hysteresis)
      shouldBeMobile = contentWidth > (containerWidth - this.HYSTERESIS_MARGIN);
    } else {
      // Desktop → Mobile váltás azonnal, ha túlnyúlik
      shouldBeMobile = contentWidth > containerWidth;
    }

    // Csak akkor frissítjük, ha változott
    if (currentlyMobile !== shouldBeMobile) {
      isMobileMode.set(shouldBeMobile);
    }
  }

  /**
   * Observer leállítása egy adott elemhez
   *
   * @param container - Figyelt container
   */
  unobserve(container: HTMLElement): void {
    const observer = this.observers.get(container);
    if (observer) {
      observer.disconnect();
      this.observers.delete(container);
    }

    // Cache-t is töröljük
    this.contentWidthCache.delete(container);
  }

  /**
   * Cleanup minden observer és timeout
   * Service destroy-kor vagy teljes reset-nél használatos
   */
  destroyAll(): void {
    this.observers.forEach(obs => obs.disconnect());
    this.observers.clear();
    this.contentWidthCache.clear();

    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
      this.resizeDebounceTimeout = undefined;
    }
  }
}
