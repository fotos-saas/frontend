/**
 * Email Hub modellek.
 * AI email feldolgozás, draft válaszok, módosítási körök, voice profile.
 */

// --- Dashboard ---

export interface EmailHubDashboard {
  pendingDrafts: number;
  pendingApproval: number;
  escalationCount: number;
  activeRounds: number;
  todayProcessed: number;
  monthlyCostUsd: number;
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
  styleDescription: string;
  styleData: Record<string, unknown>;
  formalityMap: Record<string, { formality: string; confidence: number }>;
  analyzedEmailCount: number;
  draftApprovedCount: number;
  draftEditedCount: number;
  draftRejectedCount: number;
  approvalRate: number;
  lastBuiltAt: string | null;
  lastRefinedAt: string | null;
}
