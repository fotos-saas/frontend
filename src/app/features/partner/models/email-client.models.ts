export interface EmailFolder {
  path: string;
  name: string;
  icon: string;
  unread_count: number;
  total_count: number;
}

export interface EmailLabel {
  id: number;
  name: string;
  color: string;
  sort_order?: number;
  email_count?: number;
}

export interface EmailListItem {
  id: number;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string;
  body_preview: string;
  direction: 'inbound' | 'outbound';
  is_read: boolean;
  is_starred: boolean;
  is_replied: boolean;
  has_attachments: boolean;
  attachment_count: number;
  email_date: string;
  labels: { id: number; name: string; color: string }[];
  ai_category: string | null;
  project?: { id: number; name: string } | null;
}

export interface EmailDetail extends EmailListItem {
  body_html: string | null;
  body_text: string | null;
  to_name: string | null;
  cc: { email: string; name: string | null }[] | null;
  thread_id: string | null;
  attachments: { name: string; size: number; mime_type: string }[] | null;
}

export interface QuickReply {
  text: string;
  tone: 'casual' | 'formal' | 'neutral';
}

export interface EmailClientStats {
  total: number;
  unread: number;
  needs_reply: number;
  today: number;
}
