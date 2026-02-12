import { Injectable, inject } from '@angular/core';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { LoggerService } from './logger.service';
import { safeJsonParse } from '../../shared/utils/safe-json-parse';

/**
 * Tablo Storage UI Service
 *
 * UI state kezelés:
 * - Order finalization current step
 * - Reminder state (schedule, finalization, photo selection)
 * - Step info dialog state
 * - Global settings (sidebar, stb.)
 */
@Injectable({
  providedIn: 'root'
})
export class TabloStorageUiService {
  private readonly crud = inject(TabloStorageCrudService);
  private readonly logger = inject(LoggerService);
  private readonly PREFIX = 'tablo:';
  private readonly GLOBAL_PREFIX = 'tablo:global:';

  constructor() {
    this.migrateOldKeys();
  }

  // === KEY GENERATORS ===

  private uiKey(projectId: number, suffix: string): string {
    return `${this.PREFIX}${projectId}:ui:${suffix}`;
  }

  private reminderKey(projectId: number, suffix: string): string {
    return `${this.PREFIX}${projectId}:reminder:${suffix}`;
  }

  // === UI STATE ===

  getCurrentStep(projectId: number): number {
    const step = this.crud.getItem(this.uiKey(projectId, 'current_step'));
    const parsed = parseInt(step ?? '0', 10);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(3, parsed));
  }

  setCurrentStep(projectId: number, step: number): void {
    this.crud.setItem(this.uiKey(projectId, 'current_step'), String(step));
  }

  // === REMINDER STATE (PROJEKTIZOLT) ===

  getScheduleReminderDismissedUntil(projectId: number): string | null {
    return this.crud.getItem(this.reminderKey(projectId, 'schedule_dismissed_until'));
  }

  setScheduleReminderDismissedUntil(projectId: number, date: string): void {
    this.crud.setItem(this.reminderKey(projectId, 'schedule_dismissed_until'), date);
  }

  getScheduleReminderLastShown(projectId: number): string | null {
    return this.crud.getItem(this.reminderKey(projectId, 'schedule_last_shown'));
  }

  setScheduleReminderLastShown(projectId: number, date: string): void {
    this.crud.setItem(this.reminderKey(projectId, 'schedule_last_shown'), date);
  }

  clearScheduleReminder(projectId: number): void {
    this.crud.removeItem(this.reminderKey(projectId, 'schedule_dismissed_until'));
    this.crud.removeItem(this.reminderKey(projectId, 'schedule_last_shown'));
  }

  getFinalizationReminderDismissedUntil(projectId: number): string | null {
    return this.crud.getItem(this.reminderKey(projectId, 'finalization_dismissed_until'));
  }

  setFinalizationReminderDismissedUntil(projectId: number, date: string): void {
    this.crud.setItem(this.reminderKey(projectId, 'finalization_dismissed_until'), date);
  }

  getFinalizationReminderLastShown(projectId: number): string | null {
    return this.crud.getItem(this.reminderKey(projectId, 'finalization_last_shown'));
  }

  setFinalizationReminderLastShown(projectId: number, date: string): void {
    this.crud.setItem(this.reminderKey(projectId, 'finalization_last_shown'), date);
  }

  clearFinalizationReminder(projectId: number): void {
    this.crud.removeItem(this.reminderKey(projectId, 'finalization_dismissed_until'));
    this.crud.removeItem(this.reminderKey(projectId, 'finalization_last_shown'));
  }

  // === GENERIC REMINDER METHODS ===

  getReminderValue(projectId: number, suffix: string): string | null {
    return this.crud.getItem(this.reminderKey(projectId, suffix));
  }

  setReminderValue(projectId: number, suffix: string, value: string): void {
    this.crud.setItem(this.reminderKey(projectId, suffix), value);
  }

  removeReminderValue(projectId: number, suffix: string): void {
    this.crud.removeItem(this.reminderKey(projectId, suffix));
  }

  clearAllReminders(projectId: number): void {
    this.clearScheduleReminder(projectId);
    this.clearFinalizationReminder(projectId);
  }

  // === STEP INFO DIALOG STATE (PROJECT-SPECIFIC) ===

  isStepInfoShown(projectId: number, stepName: string): boolean {
    return this.crud.getItem(this.uiKey(projectId, `step_info_shown:${stepName}`)) === 'true';
  }

  setStepInfoShown(projectId: number, stepName: string): void {
    this.crud.setItem(this.uiKey(projectId, `step_info_shown:${stepName}`), 'true');
  }

  resetStepInfoShown(projectId: number, stepName: string): void {
    this.crud.removeItem(this.uiKey(projectId, `step_info_shown:${stepName}`));
  }

  resetAllStepInfoShown(projectId: number): void {
    const steps = ['claiming', 'retouch', 'tablo', 'completed'];
    for (const step of steps) {
      this.resetStepInfoShown(projectId, step);
    }
  }

  // === GLOBAL SETTINGS (NOT SESSION-SPECIFIC) ===

  getGlobalSetting<T>(key: string): T | null {
    const stored = this.crud.getItem(`${this.GLOBAL_PREFIX}${key}`);
    if (!stored) return null;

    // Próbáljuk JSON-ként, ha nem sikerül, string-ként adjuk vissza
    const parsed = safeJsonParse<T | null>(stored, null);
    if (parsed !== null) {
      return parsed;
    }
    // Ha nem JSON, akkor string-ként adjuk vissza
    return stored as unknown as T;
  }

  setGlobalSetting<T>(key: string, value: T): void {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    this.crud.setItem(`${this.GLOBAL_PREFIX}${key}`, toStore);
  }

  removeGlobalSetting(key: string): void {
    this.crud.removeItem(`${this.GLOBAL_PREFIX}${key}`);
  }

  // === OLD KEY MIGRATION ===

  private migrateOldKeys(): void {
    try {
      // 1. Sidebar settings migráció
      const oldSidebar = localStorage.getItem('sidebar_expanded_sections');
      if (oldSidebar) {
        this.crud.setItem(`${this.GLOBAL_PREFIX}sidebar_expanded_sections`, oldSidebar);
        localStorage.removeItem('sidebar_expanded_sections');
      }

      // 2. Step info dialog kulcsok migrálása (globálisról projekt-specifikusra)
      // Ezeket NEM migráljuk, mert projekt-specifikusnak kell lenniük
      // A régi kulcsokat töröljük
      const oldStepInfoKeys = [
        'tablo_step_info_shown_claiming',
        'tablo_step_info_shown_retouch',
        'tablo_step_info_shown_tablo',
        'tablo_step_info_shown_completed'
      ];
      for (const key of oldStepInfoKeys) {
        localStorage.removeItem(key);
      }

      // 3. Order finalization step migráció
      const legacyStep = localStorage.getItem('kv:order-finalization:currentStep');
      if (legacyStep) {
        // Ezt nem migráljuk, mert projekt-specifikusnak kell lennie
        localStorage.removeItem('kv:order-finalization:currentStep');
      }

    } catch (error) {
      this.logger.warn('[TabloStorageUI] Migration error:', error);
    }
  }
}
