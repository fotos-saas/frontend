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
  response_type: { value: string; label: string };
  status: { value: string; label: string };
  draft_subject: string;
  draft_body: string;
  draft_body_html: string | null;
  final_body: string | null;
  ai_confidence: number;
  ai_model: string;
  requires_production_approval: boolean;
  production_approved: boolean | null;
  approved_at: string | null;
  sent_at: string | null;
  rejected_at: string | null;
  created_at: string;
  project_email?: DraftEmailPreview | null;
  project?: { id: number; name: string } | null;
}

export interface DraftEmailPreview {
  id: number;
  from_email: string;
  from_name: string | null;
  subject: string;
  email_date: string;
}

export type DraftFilter = 'all' | 'pending' | 'sent' | 'rejected';

// --- Módosítási Körök ---

export interface ModificationRound {
  id: number;
  round_number: number;
  status: { value: string; label: string };
  is_free: boolean;
  price_huf: number | null;
  payment_status: { value: string; label: string };
  ai_summary: string | null;
  total_tasks: number;
  completed_tasks: number;
  progress_percent: number;
  requested_at: string | null;
  completed_at: string | null;
  created_at: string;
  project?: { id: number; name: string } | null;
}

// --- AI Költségek ---

export interface AiCostSummary {
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_calls: number;
  avg_latency_ms: number;
}

export interface AiDailyCost {
  date: string;
  cost_usd: number;
  calls: number;
  input_tokens: number;
  output_tokens: number;
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
