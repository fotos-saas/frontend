import { Injectable } from '@angular/core';

/**
 * Scroll Lock Service
 *
 * Felelős a body scroll letiltásáért és visszaállításáért.
 * iOS-safe: html element-en alkalmazza a fixed pozíciót.
 */
@Injectable({
  providedIn: 'root'
})
export class ScrollLockService {
  /** Scroll pozíció mentése body lock-hoz */
  private scrollPosition = 0;

  /** Lock aktív-e */
  private isLocked = false;

  /**
   * Body scroll letiltása
   * iOS-safe: html element-en alkalmazzuk a fixed pozíciót
   */
  lock(): void {
    if (this.isLocked) return;

    this.scrollPosition = window.scrollY;
    const html = document.documentElement;
    html.style.position = 'fixed';
    html.style.top = `-${this.scrollPosition}px`;
    html.style.width = '100%';
    document.body.style.overflow = 'hidden';

    this.isLocked = true;
  }

  /**
   * Body scroll visszaállítása
   */
  unlock(): void {
    if (!this.isLocked) return;

    const html = document.documentElement;
    html.style.position = '';
    html.style.top = '';
    html.style.width = '';
    document.body.style.overflow = '';

    // Scroll pozíció visszaállítása
    window.scrollTo(0, this.scrollPosition);

    this.isLocked = false;
  }

  /**
   * Lock állapot lekérdezése
   */
  get locked(): boolean {
    return this.isLocked;
  }
}
