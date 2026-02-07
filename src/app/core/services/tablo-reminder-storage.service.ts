import { Injectable, inject } from '@angular/core';
import { TabloStorageService } from './tablo-storage.service';

/**
 * Tablo Reminder Storage Service
 *
 * Reminder (emlékeztető) állapotok kezelése localStorage-ban.
 * Schedule és finalization reminder halasztás/megjelenítés state.
 */
@Injectable({
  providedIn: 'root'
})
export class TabloReminderStorageService {
  private readonly storage = inject(TabloStorageService);

  // === SCHEDULE REMINDER ===

  getScheduleReminderDismissedUntil(projectId: number): string | null {
    return this.storage.getScheduleReminderDismissedUntil(projectId);
  }

  setScheduleReminderDismissedUntil(projectId: number, date: string): void {
    this.storage.setScheduleReminderDismissedUntil(projectId, date);
  }

  getScheduleReminderLastShown(projectId: number): string | null {
    return this.storage.getScheduleReminderLastShown(projectId);
  }

  setScheduleReminderLastShown(projectId: number, date: string): void {
    this.storage.setScheduleReminderLastShown(projectId, date);
  }

  clearScheduleReminder(projectId: number): void {
    this.storage.clearScheduleReminder(projectId);
  }

  // === FINALIZATION REMINDER ===

  getFinalizationReminderDismissedUntil(projectId: number): string | null {
    return this.storage.getFinalizationReminderDismissedUntil(projectId);
  }

  setFinalizationReminderDismissedUntil(projectId: number, date: string): void {
    this.storage.setFinalizationReminderDismissedUntil(projectId, date);
  }

  getFinalizationReminderLastShown(projectId: number): string | null {
    return this.storage.getFinalizationReminderLastShown(projectId);
  }

  setFinalizationReminderLastShown(projectId: number, date: string): void {
    this.storage.setFinalizationReminderLastShown(projectId, date);
  }

  clearFinalizationReminder(projectId: number): void {
    this.storage.clearFinalizationReminder(projectId);
  }

  // === GENERIC REMINDER METHODS ===

  getReminderValue(projectId: number, suffix: string): string | null {
    return this.storage.getReminderValue(projectId, suffix);
  }

  setReminderValue(projectId: number, suffix: string, value: string): void {
    this.storage.setReminderValue(projectId, suffix, value);
  }

  removeReminderValue(projectId: number, suffix: string): void {
    this.storage.removeReminderValue(projectId, suffix);
  }
}
