/**
 * Workflow típusok a tabló fotóválasztási folyamathoz
 */

/**
 * Workflow lépések
 * - claiming: Saját képek kiválasztása
 * - retouch: Retusálandó képek kiválasztása
 * - tablo: Tablókép kiválasztása
 * - completed: Véglegesítve (read-only)
 *
 * Megjegyzés: A 'registration' lépést kihagyjuk - a vendégek már az onboarding-on keresztül regisztráltak.
 */
export type WorkflowStep = 'claiming' | 'retouch' | 'tablo' | 'completed';

/**
 * Workflow lépés információk (UI megjelenítéshez)
 */
export interface WorkflowStepInfo {
  step: WorkflowStep;
  label: string;
  description: string;
  infoDialogTitle: string;
  infoDialogMessage: string;
}

/**
 * Workflow lépések konfigurációja
 */
export const WORKFLOW_STEPS: WorkflowStepInfo[] = [
  {
    step: 'claiming',
    label: 'Saját képek',
    description: 'Jelöld ki az összes képet, amelyen te szerepelsz.',
    infoDialogTitle: 'Saját képek kiválasztása',
    infoDialogMessage: 'Jelöld ki az összes képet, amelyen te szerepelsz. Később ezekből választhatsz retusálandó és tablóképet.',
  },
  {
    step: 'retouch',
    label: 'Retusálás',
    description: 'Válaszd ki a retusálandó képeket.',
    infoDialogTitle: 'Retusálandó képek',
    infoDialogMessage: 'Válaszd ki a képeket, amelyeket szeretnél retusáltatni. A limit a munkamenet beállításaitól függ.',
  },
  {
    step: 'tablo',
    label: 'Tablókép',
    description: 'Válassz egy képet a tablóra.',
    infoDialogTitle: 'Tablókép kiválasztása',
    infoDialogMessage: 'Válassz pontosan 1 képet, amely a tablón fog szerepelni. Ez a kép lesz a végleges tablóképed.',
  },
  {
    step: 'completed',
    label: 'Kész',
    description: 'A választásod véglegesítve.',
    infoDialogTitle: 'Véglegesítve',
    infoDialogMessage: 'A képválasztásod sikeresen véglegesítve lett. Köszönjük!',
  },
];

/**
 * Workflow fotó (backend-ről érkező adat)
 */
export interface WorkflowPhoto {
  id: number;
  url: string;
  thumbnailUrl: string;
  filename: string;
}

/**
 * Lépés metaadat (backend-ről)
 */
export interface StepMetadata {
  allow_multiple: boolean;
  max_selection: number | null;
  description: string;
}

/**
 * Work session adatok
 */
export interface WorkSessionData {
  id: number;
  max_retouch_photos: number | null;
}

/**
 * Progress adatok (backend-ről)
 */
export interface ProgressData {
  id: number;
  user_id: number;
  work_session_id: number;
  child_work_session_id: number | null;
  current_step: WorkflowStep;
  steps_data: {
    claimed_photo_ids?: number[];
    claimed_count?: number;
    retouch_photo_ids?: number[];
    retouch_count?: number;
    tablo_photo_id?: number;
  };
}

/**
 * Step Data (unified endpoint response)
 */
export interface StepData {
  current_step: WorkflowStep;
  visible_photos: WorkflowPhoto[];
  selected_photos: number[];
  step_metadata: StepMetadata;
  album_id: number;
  progress: ProgressData | null;
  work_session: WorkSessionData;
}

/**
 * Step Data API Response
 */
export interface StepDataResponse {
  current_step: WorkflowStep;
  visible_photos: ApiPhoto[];
  selected_photos: number[];
  step_metadata: StepMetadata;
  album_id: number;
  progress: ProgressData | null;
  work_session: WorkSessionData;
}

/**
 * API Photo (backend formátum)
 */
export interface ApiPhoto {
  id: number;
  filename: string;
  url?: string;
  thumbnail_url?: string;
  media?: {
    id: number;
    original_url: string;
    preview_url?: string;
  }[];
}

/**
 * Move to step response
 */
export interface MoveToStepResponse {
  data: ProgressData;
  current_step: WorkflowStep;
  workSession: WorkSessionData;
  auto_fixed?: boolean;
}

/**
 * Cascade deletion info (backend response)
 */
export interface CascadeDeleted {
  retouch?: number[];
  tablo?: boolean;
}

/**
 * Auto-save response (claiming/retouch)
 */
export interface AutoSaveResponse {
  message: string;
  cascade_deleted?: CascadeDeleted;
  cascade_message?: string;
}

/**
 * Validációs hibaüzenetek
 */
export const VALIDATION_MESSAGES = {
  claiming: {
    empty: 'Legalább 1 képet ki kell választanod.',
  },
  retouch: {
    empty: 'Legalább 1 retusálandó képet válassz.',
    tooMany: (max: number) => `Maximum ${max} képet választhatsz retusálásra.`,
  },
  tablo: {
    empty: 'Pontosan 1 képet kell kiválasztanod.',
    tooMany: 'Csak 1 tablóképet választhatsz.',
  },
};

/**
 * Üres állapot üzenetek (lépésenként)
 */
export const EMPTY_STATE_MESSAGES: Record<WorkflowStep, { title: string; description: string | null }> = {
  claiming: {
    title: 'Nincs megjeleníthető kép',
    description: null,
  },
  retouch: {
    title: 'Nincsenek kiválasztott képeid',
    description: 'Lépj vissza az előző lépésre, és válaszd ki a képeket, amelyeken szerepelsz.',
  },
  tablo: {
    title: 'Nincsenek retusálandó képeid',
    description: 'Lépj vissza az előző lépésre, és válaszd ki a retusálandó képeket.',
  },
  completed: {
    title: 'Nincs megjeleníthető kép',
    description: null,
  },
};

/**
 * Step nevek az info dialog megjelenítéséhez
 * A teljes kulcs: tablo:{projectId}:ui:step_info_shown:{stepName}
 * @see TabloStorageService.isStepInfoShown / setStepInfoShown
 */
export const STEP_INFO_NAMES: Record<WorkflowStep, string> = {
  claiming: 'claiming',
  retouch: 'retouch',
  tablo: 'tablo',
  completed: 'completed',
};

/**
 * @deprecated Használd helyette: STEP_INFO_NAMES + TabloStorageService
 * LocalStorage kulcsok az info dialog megjelenítéséhez (régi, globális)
 */
export const STEP_INFO_STORAGE_KEYS = {
  claiming: 'tablo_step_info_shown_claiming',
  retouch: 'tablo_step_info_shown_retouch',
  tablo: 'tablo_step_info_shown_tablo',
  completed: 'tablo_step_info_shown_completed',
};

/**
 * Helper: Lépés információ lekérése
 */
export function getStepInfo(step: WorkflowStep): WorkflowStepInfo | undefined {
  return WORKFLOW_STEPS.find(s => s.step === step);
}

/**
 * Helper: Lépés index lekérése (0-based)
 */
export function getStepIndex(step: WorkflowStep): number {
  return WORKFLOW_STEPS.findIndex(s => s.step === step);
}

/**
 * Helper: Következő lépés
 */
export function getNextStep(step: WorkflowStep): WorkflowStep | null {
  const index = getStepIndex(step);
  if (index === -1 || index >= WORKFLOW_STEPS.length - 1) {
    return null;
  }
  return WORKFLOW_STEPS[index + 1].step;
}

/**
 * Helper: Előző lépés
 */
export function getPreviousStep(step: WorkflowStep): WorkflowStep | null {
  const index = getStepIndex(step);
  if (index <= 0) {
    return null;
  }
  return WORKFLOW_STEPS[index - 1].step;
}

/**
 * Helper: API photo → WorkflowPhoto mapping
 */
export function mapApiPhoto(apiPhoto: ApiPhoto): WorkflowPhoto {
  // Media-ból vagy közvetlen url-ből
  const media = apiPhoto.media?.[0];
  const url = media?.original_url || apiPhoto.url || '';
  const thumbnailUrl = media?.preview_url || apiPhoto.thumbnail_url || url;

  return {
    id: apiPhoto.id,
    url,
    thumbnailUrl,
    filename: apiPhoto.filename,
  };
}
