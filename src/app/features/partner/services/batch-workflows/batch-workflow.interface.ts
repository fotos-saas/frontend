import { BatchWorkflowType, BatchJobState } from '../../models/batch.types';
import { TabloPersonItem, TabloSize } from '../../models/partner.models';

/** Egy batch job futtatásához szükséges projekt adatok */
export interface BatchProjectData {
  persons: TabloPersonItem[];
  extraNames: { students: string; teachers: string };
  size: TabloSize;
  psdPath: string;
  brandName: string | null;
}

/** Callback-ek amiket a workflow futás közben meghív */
export interface BatchWorkflowCallbacks {
  /** Lépés váltás jelzése */
  onStep: (stepIndex: number) => void;
  /** Megszakítás ellenőrzés — throw-ol ha cancel/pause */
  checkAbort: () => void;
}

/**
 * Strategy interface — minden workflow típus implementálja.
 * A queue service ezeken keresztül futtatja a jobokat.
 */
export interface BatchWorkflow {
  readonly type: BatchWorkflowType;
  readonly label: string;
  readonly stepLabels: string[];
  execute(
    job: BatchJobState,
    projectData: BatchProjectData,
    callbacks: BatchWorkflowCallbacks,
  ): Promise<void>;
}
