import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Tablo Storage CRUD Service
 *
 * Generic localStorage műveletek Safari Private mode támogatással.
 * Minden storage művelet ezen keresztül megy, automatikus memory fallback.
 */
@Injectable({
  providedIn: 'root'
})
export class TabloStorageCrudService {
  private readonly logger = inject(LoggerService);

  // Safari Private mode fallback
  private memoryFallback = new Map<string, string>();
  private useMemoryFallback = false;

  constructor() {
    this.detectPrivateMode();
  }

  /**
   * Safari Private mode detektálása.
   * Private mode-ban a localStorage.setItem() QuotaExceededError-t dob.
   */
  private detectPrivateMode(): void {
    try {
      const testKey = '__safari_private_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch {
      this.useMemoryFallback = true;
      this.logger.warn('localStorage nem elérhető, memory fallback aktív');
    }
  }

  /**
   * localStorage setItem wrapper - Safari Private mode támogatással.
   * MINDIG próbálja a localStorage-t használni, csak hiba esetén fallback-el.
   */
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      // Ha sikerült, tárolunk memory-ba is (backup)
      this.memoryFallback.set(key, value);
    } catch {
      // QuotaExceededError - memory fallback
      this.logger.warn(`[TabloStorage] localStorage.setItem failed for ${key}, using memory fallback`);
      this.useMemoryFallback = true;
      this.memoryFallback.set(key, value);
    }
  }

  /**
   * localStorage getItem wrapper - Safari Private mode támogatással.
   * Először localStorage-ból próbál, majd memory fallback.
   */
  getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return value;
      }
      // Ha localStorage-ban nincs, nézzük a memory fallback-et
      return this.memoryFallback.get(key) ?? null;
    } catch {
      // localStorage nem elérhető - memory fallback
      return this.memoryFallback.get(key) ?? null;
    }
  }

  /**
   * localStorage removeItem wrapper - Safari Private mode támogatással.
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
    // Mindig töröljük a memory fallback-ből is
    this.memoryFallback.delete(key);
  }
}
