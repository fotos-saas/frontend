import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { PostMedia } from './forum.service';

/**
 * LightboxService
 *
 * Média lightbox állapot kezelése body scroll lock-kal.
 * Automatikus cleanup a DestroyRef segítségével.
 */
@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  /** Lightbox nyitva van-e */
  readonly isOpen = signal<boolean>(false);

  /** Megjelenített média elemek */
  readonly media = signal<PostMedia[]>([]);

  /** Aktuális index */
  readonly currentIndex = signal<number>(0);

  /** Body eredeti overflow értéke (cleanup-hoz) */
  private originalOverflow = '';

  /**
   * Lightbox megnyitása
   *
   * @param mediaItems - Megjelenítendő média elemek
   * @param startIndex - Kezdő index (alapértelmezett: 0)
   */
  open(mediaItems: PostMedia[], startIndex = 0): void {
    this.media.set(mediaItems);
    this.currentIndex.set(startIndex);
    this.isOpen.set(true);
    this.lockBodyScroll();
  }

  /**
   * Lightbox bezárása
   */
  close(): void {
    this.isOpen.set(false);
    this.unlockBodyScroll();
  }

  /**
   * Navigáció adott indexre
   */
  navigateTo(index: number): void {
    const items = this.media();
    if (index >= 0 && index < items.length) {
      this.currentIndex.set(index);
    }
  }

  /**
   * Előző elemre navigálás
   */
  previous(): void {
    const current = this.currentIndex();
    const items = this.media();
    if (current > 0) {
      this.currentIndex.set(current - 1);
    } else {
      // Körbe navigálás
      this.currentIndex.set(items.length - 1);
    }
  }

  /**
   * Következő elemre navigálás
   */
  next(): void {
    const current = this.currentIndex();
    const items = this.media();
    if (current < items.length - 1) {
      this.currentIndex.set(current + 1);
    } else {
      // Körbe navigálás
      this.currentIndex.set(0);
    }
  }

  /**
   * Body scroll zárolása
   */
  private lockBodyScroll(): void {
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Body scroll feloldása
   */
  private unlockBodyScroll(): void {
    document.body.style.overflow = this.originalOverflow || '';
  }

  /**
   * Cleanup (komponens destroy esetén)
   * Manuálisan hívandó ha a komponens nem használ providedIn: 'root'-ot
   */
  cleanup(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  /**
   * DestroyRef regisztrálása automatikus cleanup-hoz
   * Használd a komponens konstruktorában
   *
   * @example
   * constructor() {
   *   this.lightboxService.registerCleanup(inject(DestroyRef));
   * }
   */
  registerCleanup(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }
}
