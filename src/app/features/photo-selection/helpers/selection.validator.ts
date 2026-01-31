import { WorkflowStep } from '../models/workflow.models';

/**
 * Validációs eredmény interface
 */
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validációs üzenetek lépésenként
 */
const VALIDATION_ERRORS = {
  claiming: {
    empty: 'Válassz ki legalább egy képet!',
  },
  retouch: {
    empty: 'Válassz ki legalább egy képet retusálásra!',
    tooMany: (max: number) => `Maximum ${max} képet választhatsz!`,
  },
  tablo: {
    empty: 'Válaszd ki a tablóképet!',
    tooMany: 'Csak egy tablóképet választhatsz!',
  },
} as const;

/**
 * Selection validáció az aktuális lépéshez
 *
 * Centralizált validációs logika - egyetlen forrás a 3 helyszín helyett:
 * - tablo-workflow.service.ts
 * - photo-selection.state.ts
 * - selection-grid.component.ts
 *
 * @param step Aktuális workflow lépés
 * @param count Kiválasztott fotók száma
 * @param max Maximum kiválasztható (null = korlátlan)
 * @returns ValidationResult object
 */
export function validateSelection(
  step: WorkflowStep,
  count: number,
  max: number | null
): ValidationResult {
  switch (step) {
    case 'claiming':
      if (count === 0) {
        return { isValid: false, error: VALIDATION_ERRORS.claiming.empty };
      }
      break;

    case 'retouch':
      if (count === 0) {
        return { isValid: false, error: VALIDATION_ERRORS.retouch.empty };
      }
      if (max !== null && count > max) {
        return { isValid: false, error: VALIDATION_ERRORS.retouch.tooMany(max) };
      }
      break;

    case 'tablo':
      if (count === 0) {
        return { isValid: false, error: VALIDATION_ERRORS.tablo.empty };
      }
      if (count > 1) {
        return { isValid: false, error: VALIDATION_ERRORS.tablo.tooMany };
      }
      break;

    case 'completed':
      // Completed lépésen mindig valid
      return { isValid: true, error: null };
  }

  return { isValid: true, error: null };
}

/**
 * Maximum elérve-e
 *
 * @param count Kiválasztott fotók száma
 * @param max Maximum kiválasztható (null = korlátlan)
 * @returns true ha a maximum elérve
 */
export function isMaxReached(count: number, max: number | null): boolean {
  return max !== null && count >= max;
}
