import { Injectable, inject } from '@angular/core';
import { TabloStorageService } from './tablo-storage.service';
import { PhotoSelectionProgress } from '../models/auth.models';

/**
 * Workflow lépés típus
 */
export type ReminderWorkflowStep = 'claiming' | 'retouch' | 'tablo' | 'finalization' | 'completed';

/**
 * Lépésenkénti emlékeztető üzenet
 */
export interface StepReminderMessage {
  title: string;
  description: string;
  button: string;
}

/**
 * Lépésenkénti emlékeztető üzenetek
 */
export const STEP_REMINDER_MESSAGES: Record<Exclude<ReminderWorkflowStep, 'completed'>, StepReminderMessage> = {
  claiming: {
    title: 'Hahó! Ess neki a képválasztásnak!',
    description: 'Jelöld ki az összes képet, amelyen te szerepelsz. A határidő közeleg!',
    button: 'Megyek választani!'
  },
  retouch: {
    title: 'Ne felejtsd el a retusálást!',
    description: 'Válaszd ki a retusálandó képeket a folytatáshoz.',
    button: 'Folytatom!'
  },
  tablo: {
    title: 'Válaszd ki a tablóképed!',
    description: 'Már csak egy lépés: válaszd ki, melyik kép kerüljön a tablóra!',
    button: 'Kiválasztom!'
  },
  finalization: {
    title: 'Véglegesítsd a választásod!',
    description: 'Már minden kész, csak a véglegesítés gombra kell kattintanod!',
    button: 'Véglegesítem!'
  }
};

/**
 * Photo Selection Reminder Service
 *
 * Kezeli a képválasztás lépésenkénti emlékeztető megjelenítését.
 * TabloStorageService-t használ a konzisztens kulcs formátumhoz.
 *
 * Storage kulcs formátum: tablo:{projectId}:reminder:photo_selection:{step}:{type}
 *
 * Szabályok:
 * - Ha nincs galéria (hasGallery=false) → nem jelenik meg
 * - Ha már véglegesítve a választás (completed step) → nem jelenik meg
 * - Ha dismissedUntil > now → nem jelenik meg (halasztva)
 * - Ha az elmúlt 12 órában megjelent (adott step-hez) → nem jelenik meg újra
 * - Step váltáskor automatikusan "friss" (más storage kulcs)
 */
@Injectable({
  providedIn: 'root'
})
export class PhotoSelectionReminderService {
  private readonly storage = inject(TabloStorageService);

  /** 12 órás cooldown (milliszekundumban) */
  private readonly COOLDOWN_MS = 12 * 60 * 60 * 1000;

  /**
   * Ellenőrzi, hogy meg kell-e jeleníteni az emlékeztetőt
   *
   * @param projectId Projekt ID
   * @param hasGallery Van-e feltöltött galéria
   * @param currentStep Aktuális workflow lépés
   */
  shouldShowReminder(
    projectId: number,
    hasGallery: boolean,
    currentStep: ReminderWorkflowStep | null | undefined
  ): boolean {
    // Ha nincs galéria → nem kell
    if (!hasGallery) {
      return false;
    }

    // Ha nincs step vagy completed → nem kell
    if (!currentStep || currentStep === 'completed') {
      return false;
    }

    // Ha nincs üzenet ehhez a step-hez → nem kell
    if (!(currentStep in STEP_REMINDER_MESSAGES)) {
      return false;
    }

    // Közös állapot ellenőrzés (halasztás) - step-specifikus kulccsal
    if (this.shouldSkipByStateForStep(projectId, currentStep)) {
      return false;
    }

    // 12 órás cooldown ellenőrzés - step-specifikus kulccsal
    if (this.isWithinCooldownForStep(projectId, currentStep)) {
      return false;
    }

    return true;
  }

  /**
   * Lépésenkénti üzenet lekérése
   */
  getMessageForStep(step: ReminderWorkflowStep): StepReminderMessage | null {
    if (step === 'completed' || !(step in STEP_REMINDER_MESSAGES)) {
      return null;
    }
    return STEP_REMINDER_MESSAGES[step as Exclude<ReminderWorkflowStep, 'completed'>];
  }

  /**
   * Meghatározza az effektív lépést a progress alapján
   *
   * Logika:
   * - claimed_count = 0 → claiming
   * - claimed_count > 0 AND retouch_count = 0 → retouch
   * - retouch_count > 0 AND tablo_media_id = null → tablo
   * - tablo_media_id != null AND NOT finalized → finalization
   * - finalized → completed
   *
   * @param currentStep Backend által visszaadott current_step
   * @param progress Photo selection progress adatok
   * @param isFinalized Véglegesítve van-e a képválasztás
   */
  getEffectiveStep(
    currentStep: ReminderWorkflowStep | null | undefined,
    progress: PhotoSelectionProgress | null | undefined,
    isFinalized: boolean = false
  ): ReminderWorkflowStep | null {
    // Ha nincs progress adat, használjuk a current_step-et
    if (!progress) {
      return currentStep || null;
    }

    // Ha nincs claimed kép → claiming
    if (progress.claimedCount === 0) {
      return 'claiming';
    }

    // Ha van claimed, de nincs retouch → retouch
    if (progress.retouchCount === 0) {
      return 'retouch';
    }

    // Ha van retouch, de nincs tablo → tablo
    if (!progress.hasTabloPhoto) {
      return 'tablo';
    }

    // Ha van tablókép, de nincs véglegesítve → finalization
    if (!isFinalized) {
      return 'finalization';
    }

    // Minden kész és véglegesítve → completed
    return 'completed';
  }

  /**
   * Megjelöli, hogy az adott step-nél megjelent az emlékeztető
   */
  markAsShownForStep(projectId: number, step: ReminderWorkflowStep): void {
    const suffix = this.getStepShownSuffix(step);
    this.storage.setReminderValue(projectId, suffix, new Date().toISOString());
  }

  /**
   * Halasztás beállítása step-specifikus kulccsal
   */
  setDismissalForStep(projectId: number, step: ReminderWorkflowStep, days: number = 0.5): void {
    const dismissUntil = new Date();
    dismissUntil.setTime(dismissUntil.getTime() + days * 24 * 60 * 60 * 1000);

    const suffix = this.getStepDismissedSuffix(step);
    this.storage.setReminderValue(projectId, suffix, dismissUntil.toISOString());
  }

  /**
   * 12 órás snooze (a "Később" gombhoz) - step-specifikus
   */
  snoozeForHalfDayForStep(projectId: number, step: ReminderWorkflowStep): void {
    this.setDismissalForStep(projectId, step, 0.5);
  }

  /**
   * Ellenőrzi a step-specifikus halasztási/megjelenési feltételeket
   */
  private shouldSkipByStateForStep(projectId: number, step: ReminderWorkflowStep): boolean {
    // ProjectId validáció
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return true;
    }

    // Halasztva van?
    const suffix = this.getStepDismissedSuffix(step);
    const dismissedRaw = this.storage.getReminderValue(projectId, suffix);
    const dismissedUntil = this.parseAndValidateDate(dismissedRaw);

    if (dismissedUntil && new Date() < dismissedUntil) {
      return true;
    }

    return false;
  }

  /**
   * Ellenőrzi, hogy a step-specifikus cooldown időn belül vagyunk-e (12 óra)
   */
  private isWithinCooldownForStep(projectId: number, step: ReminderWorkflowStep): boolean {
    const suffix = this.getStepShownSuffix(step);
    const lastShownStr = this.storage.getReminderValue(projectId, suffix);

    if (!lastShownStr) {
      return false;
    }

    const lastShown = this.parseAndValidateDate(lastShownStr);
    if (!lastShown) {
      return false;
    }

    const now = new Date();
    const elapsed = now.getTime() - lastShown.getTime();

    return elapsed < this.COOLDOWN_MS;
  }

  /**
   * Storage suffix - step-specifikus dismissed
   * Teljes kulcs: tablo:{projectId}:reminder:photo_selection:{step}:dismissed_until
   */
  private getStepDismissedSuffix(step: ReminderWorkflowStep): string {
    return `photo_selection:${step}:dismissed_until`;
  }

  /**
   * Storage suffix - step-specifikus shown
   * Teljes kulcs: tablo:{projectId}:reminder:photo_selection:{step}:last_shown
   */
  private getStepShownSuffix(step: ReminderWorkflowStep): string {
    return `photo_selection:${step}:last_shown`;
  }

  /**
   * Biztonságos dátum parsing validációval
   */
  private parseAndValidateDate(value: string | null): Date | null {
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
}
