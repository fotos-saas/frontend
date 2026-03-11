import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Tablo Storage CRUD Service
 *
 * Generic sessionStorage műveletek Safari Private mode támogatással.
 * SECURITY: sessionStorage-t használ localStorage helyett — XSS támadás esetén
 * a tokenek nem olvashatók ki más tab-okból, és böngésző bezárásakor törlődnek.
 *
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
    this.migrateLegacyLocalStorage();
  }

  /**
   * Safari Private mode detektálása.
   * Private mode-ban a sessionStorage.setItem() QuotaExceededError-t dob.
   */
  private detectPrivateMode(): void {
    try {
      const testKey = '__safari_private_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
    } catch {
      this.useMemoryFallback = true;
      this.logger.warn('sessionStorage nem elérhető, memory fallback aktív');
    }
  }

  /**
   * Egyszeri migráció: régi localStorage kulcsok áthelyezése sessionStorage-ba, majd törlése.
   * Ez biztosítja, hogy a korábbi localStorage-ban tárolt tablo: prefix-ű adatok
   * ne veszeljenek el frissítés után, de utána már sessionStorage-ban legyenek.
   */
  private migrateLegacyLocalStorage(): void {
    try {
      const keysToMigrate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tablo:')) {
          keysToMigrate.push(key);
        }
      }

      for (const key of keysToMigrate) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Csak akkor írjuk sessionStorage-ba, ha ott még nincs (ne írjuk felül frissebb adatot)
          if (sessionStorage.getItem(key) === null) {
            sessionStorage.setItem(key, value);
          }
          // Régi localStorage kulcs törlése
          localStorage.removeItem(key);
        }
      }

      if (keysToMigrate.length > 0) {
        this.logger.info(`[TabloStorage] ${keysToMigrate.length} localStorage kulcs migrálva sessionStorage-ba`);
      }
    } catch {
      // Silent fail — ha localStorage nem elérhető, nincs mit migrálni
    }
  }

  /**
   * sessionStorage setItem wrapper - Safari Private mode támogatással.
   * MINDIG próbálja a sessionStorage-t használni, csak hiba esetén fallback-el.
   */
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
      // Ha sikerült, tárolunk memory-ba is (backup)
      this.memoryFallback.set(key, value);
    } catch {
      // QuotaExceededError - memory fallback
      this.logger.warn(`[TabloStorage] sessionStorage.setItem failed for ${key}, using memory fallback`);
      this.useMemoryFallback = true;
      this.memoryFallback.set(key, value);
    }
  }

  /**
   * sessionStorage getItem wrapper - Safari Private mode támogatással.
   * Először sessionStorage-ból próbál, majd memory fallback.
   */
  getItem(key: string): string | null {
    try {
      const value = sessionStorage.getItem(key);
      if (value !== null) {
        return value;
      }
      // Ha sessionStorage-ban nincs, nézzük a memory fallback-et
      return this.memoryFallback.get(key) ?? null;
    } catch {
      // sessionStorage nem elérhető - memory fallback
      return this.memoryFallback.get(key) ?? null;
    }
  }

  /**
   * sessionStorage removeItem wrapper - Safari Private mode támogatással.
   */
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silent fail
    }
    // Mindig töröljük a memory fallback-ből is
    this.memoryFallback.delete(key);
  }
}
