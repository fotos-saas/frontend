/**
 * Email Hub modellek.
 * AI email feldolgozás, draft válaszok, módosítási körök, voice profile.
 */

// --- Dashboard ---

export interface EmailHubDashboard {
  pending_drafts: number;
  pending_approval: number;
  escalation_count: number;
  active_rounds: number;
  today_processed: number;
  monthly_cost_usd: number;
}

// --- Draft Válaszok ---

export interface DraftResponse {
  id: number;
  responseType: string;
  responseTypeLabel: string;
  status: string;
  statusLabel: string;
  draftSubject: string;
  draftBody: string;
  draftBodyHtml: string | null;
  finalBody: string | null;
  aiConfidence: number;
  aiModel: string;
  aiReasoning: Record<string, unknown> | null;
  requiresProductionApproval: boolean;
  productionApproved: boolean | null;
  fewShotEmailIds: number[] | null;
  approvedAt: string | null;
  sentAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  projectEmail?: DraftEmailPreview | null;
  project?: { id: number; name: string } | null;
}

export interface DraftEmailPreview {
  id: number;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  bodyPreview: string;
  emailDate: string;
}

export type DraftFilter = 'all' | 'pending' | 'sent' | 'rejected';

// --- Módosítási Körök ---

export interface ModificationRound {
  id: number;
  roundNumber: number;
  status: string;
  statusLabel: string;
  statusColor: string;
  isFree: boolean;
  priceHuf: number | null;
  paymentStatus: string;
  paymentStatusLabel: string;
  aiSummary: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  requestedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// --- AI Költségek ---

export interface AiCostSummary {
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byModel: AiModelCost[];
  byAction: AiActionCost[];
}

export interface AiModelCost {
  model: string;
  costUsd: number;
  callCount: number;
}

export interface AiActionCost {
  action: string;
  costUsd: number;
  callCount: number;
}

export interface AiDailyCost {
  date: string;
  costUsd: number;
  callCount: number;
}

// --- Voice Profile ---

export interface VoiceProfile {
  id: number;
  style_description: string;
  analyzed_email_count: number;
  draft_approved_count: number;
  draft_edited_count: number;
  draft_rejected_count: number;
  approval_rate: number;
  needs_rebuild: boolean;
  last_built_at: string | null;
  last_refined_at: string | null;
}
