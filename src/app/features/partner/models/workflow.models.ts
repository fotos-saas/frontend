/**
 * Workflow Models
 *
 * Automatizált munkafolyamatok típusai és interfészei.
 * Fotócsere, véglegesítés, emlékeztető workflow-k kezelése.
 */

// ============================================
// TÍPUSOK
// ============================================

export type WorkflowType = 'photo_swap' | 'finalization' | 'reminder';
export type WorkflowStatus = 'pending' | 'running' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed' | 'failed';
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type WorkflowExecutor = 'backend' | 'electron';
export type WorkflowTriggerType = 'event' | 'schedule' | 'manual';
export type WorkflowApprovalLocation = 'web' | 'desktop' | 'both';

// ============================================
// API INTERFÉSZEK
// ============================================

export interface WorkflowListItem {
  id: number;
  project_id: number;
  project_name: string;
  type: WorkflowType;
  status: WorkflowStatus;
  trigger_type: WorkflowTriggerType;
  triggered_by: string;
  approval_location: WorkflowApprovalLocation;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface WorkflowDetail extends WorkflowListItem {
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  approval_data: WorkflowApprovalData | null;
  approved_by: { id: number; name: string } | null;
  approved_at: string | null;
  rejected_reason: string | null;
  error_message: string | null;
  steps: WorkflowStep[];
}

export interface WorkflowApprovalData {
  summary: string;
  changes: WorkflowChange[];
  email_draft?: WorkflowEmailDraft;
  sample_url?: string;
}

export interface WorkflowChange {
  person_id: number;
  person_name: string;
  before_url: string | null;
  after_url: string | null;
  change_type: 'added' | 'changed' | 'removed';
}

export interface WorkflowEmailDraft {
  subject: string;
  body: string;
  recipients: string[];
}

export interface WorkflowStep {
  id: number;
  step_key: string;
  step_order: number;
  status: WorkflowStepStatus;
  executor: WorkflowExecutor;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface WorkflowScheduleSettings {
  id?: number;
  workflow_type: WorkflowType;
  schedule_time: string; // HH:mm formátum
  is_active: boolean;
  conditions: {
    min_changed_photos?: number;
  };
  project_id?: number | null;
}

// ============================================
// PAGINÁLT VÁLASZ
// ============================================

export interface WorkflowListResponse {
  data: WorkflowListItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ============================================
// DASHBOARD STATISZTIKÁK
// ============================================

export interface WorkflowDashboardStats {
  pending_approval: number;
  running: number;
  completed_today: number;
  failed_today: number;
}

// ============================================
// CÍMKE ÉS SZÍN TÉRKÉPEK
// ============================================

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  photo_swap: 'Fotócsere',
  finalization: 'Véglegesítés',
  reminder: 'Emlékeztető',
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Várakozik',
  running: 'Fut',
  awaiting_approval: 'Jóváhagyásra vár',
  approved: 'Jóváhagyva',
  rejected: 'Elutasítva',
  completed: 'Befejezve',
  failed: 'Hiba',
};

export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  pending: 'gray',
  running: 'blue',
  awaiting_approval: 'amber',
  approved: 'green',
  rejected: 'red',
  completed: 'green',
  failed: 'red',
};

export const WORKFLOW_STEP_LABELS: Record<string, string> = {
  check_changes: 'Változások ellenőrzése',
  backup_psd: 'PSD mentés',
  place_photos: 'Fotók behelyezése',
  generate_sample: 'Minta generálás',
  build_summary: 'Összefoglaló készítés',
  draft_email: 'Email vázlat',
  move_to_approval: 'Jóváhagyásra küldés',
};
