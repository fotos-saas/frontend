/**
 * Batch Photoshop automatizalas tipusok.
 * Kosar (workspace) + queue state + workflow tipusok.
 */

/** Workflow tipusok — milyen Photoshop muveletet kell vegrehajtani */
export type BatchWorkflowType = 'generate-psd' | 'generate-sample' | 'finalize';

/** Egy job statusza a queue-ban */
export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** A teljes queue statusza */
export type BatchQueueStatus = 'idle' | 'running' | 'paused' | 'completed';

/** Kosar elem — egy projekt + egy workflow tipus paros */
export interface BatchWorkspaceItem {
  id: string;
  projectId: number;
  projectName: string;
  schoolName: string | null;
  className: string | null;
  personsCount: number;
  sampleThumbUrl: string | null;
  workflowType: BatchWorkflowType;
  addedAt: string;
}

/** Egy job allapota a futasi queue-ban */
export interface BatchJobState {
  id: string;
  projectId: number;
  projectName: string;
  schoolName: string | null;
  className: string | null;
  workflowType: BatchWorkflowType;
  status: BatchJobStatus;
  error?: string;
  retryable?: boolean;
  startedAt?: string;
  completedAt?: string;
  currentStep?: string;
  stepIndex?: number;
  stepCount?: number;
}

/** A teljes queue allapota (mega-signal) */
export interface BatchQueueState {
  jobs: BatchJobState[];
  status: BatchQueueStatus;
  currentJobId: string | null;
  startedAt?: string;
  completedAt?: string;
}

/** Workflow label-ek a megjelenateshez */
export const BATCH_WORKFLOW_LABELS: Record<BatchWorkflowType, string> = {
  'generate-psd': 'PSD generálás',
  'generate-sample': 'Minta generálás',
  'finalize': 'Véglegesítés',
};
