import { Injectable } from '@angular/core';
import { BaseReminderService } from './base-reminder.service';

/**
 * Schedule Reminder Service
 *
 * Kezeli a fotózás időpont emlékeztető megjelenítését.
 * LocalStorage-ban tárolja a halasztási és megjelenítési állapotot.
 *
 * Szabályok:
 * - Ha photoDate kitöltve → nem jelenik meg
 * - Ha dismissedUntil > now → nem jelenik meg
 * - Ha ma már megjelent → nem jelenik meg újra
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleReminderService extends BaseReminderService {
  protected readonly DISMISSED_SUFFIX = 'schedule_dismissed_until';
  protected readonly SHOWN_SUFFIX = 'schedule_last_shown';

  /**
   * Ellenőrzi, hogy meg kell-e jeleníteni az emlékeztetőt
   */
  shouldShowReminder(projectId: number, photoDate: string | null | undefined): boolean {
    // Ha van már photoDate → nem kell
    if (photoDate) {
      return false;
    }

    // Közös állapot ellenőrzés (projectId, halasztás, napi limit)
    if (this.shouldSkipByState(projectId)) {
      return false;
    }

    return true;
  }
}
