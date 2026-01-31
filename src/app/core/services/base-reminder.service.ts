import { inject } from '@angular/core';
import { TabloStorageService } from './tablo-storage.service';

/**
 * Emlékeztető állapot interface
 */
export interface ReminderState {
  dismissedUntil: Date | null;
  lastShown: Date | null;
}

/**
 * Base Reminder Service
 *
 * Absztrakt alap emlékeztető szolgáltatás.
 * TabloStorageService-en keresztül tárolja a halasztási és megjelenítési állapotot.
 *
 * Kulcs struktúra: `tablo:{projectId}:reminder:{suffix}`
 *
 * Közös funkcionalitás:
 * - Halasztás kezelés (dismissedUntil)
 * - Napi egyszer megjelenítés (lastShown)
 * - Biztonságos dátum parsing validációval
 * - Storage key management
 *
 * Használat:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class MyReminderService extends BaseReminderService {
 *   protected readonly DISMISSED_SUFFIX = 'my_reminder_dismissed_until';
 *   protected readonly SHOWN_SUFFIX = 'my_reminder_last_shown';
 * }
 * ```
 */
export abstract class BaseReminderService {
  /** Override-olandó: dismissed storage key suffix */
  protected abstract readonly DISMISSED_SUFFIX: string;

  /** Override-olandó: shown storage key suffix */
  protected abstract readonly SHOWN_SUFFIX: string;

  /** TabloStorageService - lusta inject az absztrakt osztályban */
  private _storage?: TabloStorageService;
  protected get storage(): TabloStorageService {
    if (!this._storage) {
      this._storage = inject(TabloStorageService);
    }
    return this._storage;
  }

  /**
   * Megjelöli, hogy ma megjelent az emlékeztető
   */
  markAsShown(projectId: number): void {
    this.storage.setReminderValue(projectId, this.SHOWN_SUFFIX, new Date().toISOString());
    this.migrateOldKeyIfExists(projectId, 'shown');
  }

  /**
   * Beállítja a halasztást (napokban)
   * @param projectId - Projekt ID
   * @param days - Halasztás napokban
   */
  setDismissal(projectId: number, days: number): void {
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + days);
    dismissUntil.setHours(0, 0, 0, 0);

    this.storage.setReminderValue(projectId, this.DISMISSED_SUFFIX, dismissUntil.toISOString());
    this.migrateOldKeyIfExists(projectId, 'dismissed');
  }

  /**
   * Törli az emlékeztető állapotát
   */
  clearReminder(projectId: number): void {
    this.storage.removeReminderValue(projectId, this.DISMISSED_SUFFIX);
    this.storage.removeReminderValue(projectId, this.SHOWN_SUFFIX);
    // Régi kulcsok törlése is
    this.migrateOldKeyIfExists(projectId, 'both');
  }

  /**
   * Lekéri az emlékeztető állapotát storage-ból
   */
  protected getReminderState(projectId: number): ReminderState {
    // Először próbáljuk az új kulcsokat
    let dismissedRaw = this.storage.getReminderValue(projectId, this.DISMISSED_SUFFIX);
    let shownRaw = this.storage.getReminderValue(projectId, this.SHOWN_SUFFIX);

    // Ha nincs, próbáljuk a régi kv: prefix-es kulcsokat és migráljuk
    if (!dismissedRaw) {
      dismissedRaw = this.getAndMigrateOldKey(projectId, 'dismissed');
    }
    if (!shownRaw) {
      shownRaw = this.getAndMigrateOldKey(projectId, 'shown');
    }

    return {
      dismissedUntil: this.parseAndValidateDate(dismissedRaw),
      lastShown: this.parseAndValidateDate(shownRaw)
    };
  }

  /**
   * Ellenőrzi a közös halasztási/megjelenési feltételeket
   * @returns true ha a reminder-t nem kell mutatni (halasztva vagy ma már megjelent)
   */
  protected shouldSkipByState(projectId: number): boolean {
    // ProjectId validáció
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return true;
    }

    const state = this.getReminderState(projectId);

    // Halasztva van?
    if (state.dismissedUntil && new Date() < state.dismissedUntil) {
      return true;
    }

    // Ma már megjelent?
    if (state.lastShown) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastShownDay = new Date(state.lastShown);
      lastShownDay.setHours(0, 0, 0, 0);
      if (today.getTime() === lastShownDay.getTime()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Biztonságos dátum parsing validációval
   */
  protected parseAndValidateDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    // Hossz ellenőrzés (ISO string max ~30 karakter)
    if (value.length > 30) {
      return null;
    }

    // ISO 8601 formátum regex ellenőrzés
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!isoRegex.test(value)) {
      return null;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }

    // Ésszerű tartomány (nem túl régi, nem túl távoli jövő)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (date < oneYearAgo || date > oneYearFromNow) {
      return null;
    }

    return date;
  }

  // === MIGRATION FROM OLD kv: PREFIX ===

  /**
   * Régi kulcs lekérése és migrálása
   */
  private getAndMigrateOldKey(projectId: number, type: 'dismissed' | 'shown'): string | null {
    const suffix = type === 'dismissed' ? this.DISMISSED_SUFFIX : this.SHOWN_SUFFIX;
    // Régi formátum: kv:{projectId}:{suffix} (a suffix már tartalmazza a : karaktert)
    const oldKey = `kv:${projectId}:${suffix}`;

    try {
      const value = localStorage.getItem(oldKey);
      if (value) {
        // Migráljuk az új helyre
        this.storage.setReminderValue(projectId, suffix, value);
        // Töröljük a régit
        localStorage.removeItem(oldKey);
        return value;
      }
    } catch {
      // Silent fail
    }
    return null;
  }

  /**
   * Régi kulcs törlése ha létezik
   */
  private migrateOldKeyIfExists(projectId: number, type: 'dismissed' | 'shown' | 'both'): void {
    try {
      if (type === 'dismissed' || type === 'both') {
        const oldDismissedKey = `kv:${projectId}:${this.DISMISSED_SUFFIX}`;
        localStorage.removeItem(oldDismissedKey);
      }
      if (type === 'shown' || type === 'both') {
        const oldShownKey = `kv:${projectId}:${this.SHOWN_SUFFIX}`;
        localStorage.removeItem(oldShownKey);
      }
    } catch {
      // Silent fail
    }
  }
}
