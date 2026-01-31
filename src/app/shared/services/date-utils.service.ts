import { Injectable } from '@angular/core';

/**
 * DateUtilsService
 *
 * Dátum/idő segédeszközök:
 * - Deadline számítás
 * - Relatív idő formázás
 * - Dátum összehasonlítás
 *
 * Használat:
 *   dateUtils.getDeadlineText(closeAt)
 *   dateUtils.isExpired(closeAt)
 */
@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {

  /** Milliseconds in one day */
  private readonly MS_PER_DAY = 1000 * 60 * 60 * 24;

  /** Milliseconds in one hour */
  private readonly MS_PER_HOUR = 1000 * 60 * 60;

  /** Milliseconds in one minute */
  private readonly MS_PER_MINUTE = 1000 * 60;

  /**
   * Ellenőrzi, hogy a dátum lejárt-e.
   */
  isExpired(dateString: string | null | undefined): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return date.getTime() < Date.now();
  }

  /**
   * Hátralévő idő milliszekundumban.
   * Negatív érték = lejárt.
   */
  getRemainingMs(dateString: string | null | undefined): number | null {
    if (!dateString) return null;

    const date = new Date(dateString);
    return date.getTime() - Date.now();
  }

  /**
   * Hátralévő napok száma.
   * 0 = ma jár le, negatív = lejárt.
   */
  getRemainingDays(dateString: string | null | undefined): number | null {
    const remainingMs = this.getRemainingMs(dateString);
    if (remainingMs === null) return null;

    return Math.floor(remainingMs / this.MS_PER_DAY);
  }

  /**
   * Hátralévő órák száma (a napok levonása után).
   */
  getRemainingHours(dateString: string | null | undefined): number | null {
    const remainingMs = this.getRemainingMs(dateString);
    if (remainingMs === null) return null;

    return Math.floor((remainingMs % this.MS_PER_DAY) / this.MS_PER_HOUR);
  }

  /**
   * Deadline szöveg formázása.
   * Pl: "3 nap van hátra", "5 óra van hátra", "Lejárt", "Hamarosan lejár"
   */
  getDeadlineText(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const remainingMs = this.getRemainingMs(dateString);
    if (remainingMs === null) return '';

    if (remainingMs < 0) return 'Lejárt';

    const days = Math.floor(remainingMs / this.MS_PER_DAY);
    const hours = Math.floor((remainingMs % this.MS_PER_DAY) / this.MS_PER_HOUR);

    if (days > 0) {
      return `${days} nap van hátra`;
    }
    if (hours > 0) {
      return `${hours} óra van hátra`;
    }
    return 'Hamarosan lejár';
  }

  /**
   * Dátum formázása magyar locale-lel.
   * Format: "2024. jan. 15."
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Dátum és idő formázása magyar locale-lel.
   * Format: "2024. jan. 15. 14:30"
   */
  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Csak idő formázása.
   * Format: "14:30"
   */
  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Deadline számítás napok alapján (jövőbeli dátum).
   * @param days Napok száma a mai naptól
   * @returns ISO string a jövőbeli dátummal
   */
  calculateDeadline(days: number): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    deadline.setHours(23, 59, 59, 999);
    return deadline.toISOString();
  }

  /**
   * Két dátum közötti különbség napokban.
   */
  daysBetween(start: string | Date, end: string | Date): number {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / this.MS_PER_DAY);
  }

  /**
   * Ellenőrzi, hogy a dátum a mai nap-e.
   */
  isToday(dateString: string | null | undefined): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    const today = new Date();

    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  /**
   * Ellenőrzi, hogy a dátum a jövőben van-e.
   */
  isFuture(dateString: string | null | undefined): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return date.getTime() > Date.now();
  }

  /**
   * Ellenőrzi, hogy a dátum a múltban van-e.
   */
  isPast(dateString: string | null | undefined): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return date.getTime() < Date.now();
  }

  /**
   * Relatív idő formázása magyarul (múlt).
   * Pl: "most", "5 perce", "2 órája", "3 napja", "2024. jan. 15."
   *
   * @param dateString ISO dátum string
   * @returns Magyar nyelvű relatív idő
   */
  getRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Jövőbeli dátumok
    if (diffMs < 0) {
      return this.formatDate(dateString);
    }

    const diffMins = Math.floor(diffMs / this.MS_PER_MINUTE);
    const diffHours = Math.floor(diffMs / this.MS_PER_HOUR);
    const diffDays = Math.floor(diffMs / this.MS_PER_DAY);

    if (diffMins < 1) return 'most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays < 7) return `${diffDays} napja`;

    return this.formatDate(dateString);
  }

  /**
   * Relatív idő formázása magyarul (jövő).
   * Pl: "most", "5 perc múlva", "2 óra múlva", "3 nap múlva"
   *
   * @param dateString ISO dátum string
   * @returns Magyar nyelvű relatív idő
   */
  getRelativeTimeFuture(dateString: string | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    // Múltbeli dátumok
    if (diffMs < 0) {
      return this.getRelativeTime(dateString);
    }

    const diffMins = Math.floor(diffMs / this.MS_PER_MINUTE);
    const diffHours = Math.floor(diffMs / this.MS_PER_HOUR);
    const diffDays = Math.floor(diffMs / this.MS_PER_DAY);

    if (diffMins < 1) return 'most';
    if (diffMins < 60) return `${diffMins} perc múlva`;
    if (diffHours < 24) return `${diffHours} óra múlva`;
    if (diffDays < 7) return `${diffDays} nap múlva`;

    return this.formatDate(dateString);
  }
}
