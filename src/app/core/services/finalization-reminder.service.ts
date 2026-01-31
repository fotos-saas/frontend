import { Injectable } from '@angular/core';
import { BaseReminderService } from './base-reminder.service';

/**
 * Finalization Reminder Service
 *
 * Kezeli a tervkészítés véglegesítés emlékeztető megjelenítését.
 * LocalStorage-ban tárolja a halasztási és megjelenítési állapotot.
 *
 * Szabályok:
 * - Ha projekt már véglegesítve → nem jelenik meg
 * - Ha user nem véglegesíthet (share/preview) → nem jelenik meg
 * - Ha dismissedUntil > now → nem jelenik meg
 * - Ha ma már megjelent → nem jelenik meg újra
 */
@Injectable({
  providedIn: 'root'
})
export class FinalizationReminderService extends BaseReminderService {
  protected readonly DISMISSED_SUFFIX = 'finalization_dismissed_until';
  protected readonly SHOWN_SUFFIX = 'finalization_last_shown';

  /**
   * Ellenőrzi, hogy meg kell-e jeleníteni az emlékeztetőt
   *
   * @param projectId Projekt ID
   * @param isFinalized Már véglegesítve van-e
   * @param canFinalize Van-e jogosultsága véglegesíteni
   */
  shouldShowReminder(
    projectId: number,
    isFinalized: boolean,
    canFinalize: boolean
  ): boolean {
    // Ha már véglegesítve → nem kell
    if (isFinalized) {
      return false;
    }

    // Ha nem véglegesíthet (share/preview user) → nem kell
    if (!canFinalize) {
      return false;
    }

    // Közös állapot ellenőrzés (projectId, halasztás, napi limit)
    if (this.shouldSkipByState(projectId)) {
      return false;
    }

    return true;
  }

  /**
   * Beállítja a halasztást (napokban)
   * Alapértelmezetten 7 nap (heti)
   */
  override setDismissal(projectId: number, days: number = 7): void {
    super.setDismissal(projectId, days);
  }
}
