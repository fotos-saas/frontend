/**
 * Projekt email modellek.
 * Az IMAP-ból szinkronizált emailek kezelése.
 */

export interface ProjectEmail {
  id: number;
  messageId: string;
  threadId: string | null;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  toName: string | null;
  cc: EmailAddress[];
  subject: string;
  bodyPreview: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  direction: 'inbound' | 'outbound';
  isRead: boolean;
  needsReply: boolean;
  isReplied: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments: EmailAttachment[];
  emailDate: string;
}

export interface EmailAddress {
  email: string;
  name: string | null;
}

export interface EmailAttachment {
  /** Backend 'name' mezőnévvel küldi */
  name: string;
  /** Alias — ha a backend filename-ként küldi */
  filename?: string;
  mime_type: string;
  size?: number;
}

export interface EmailDetailResponse {
  email: ProjectEmail;
  thread: ProjectEmail[];
}

export interface EmailStats {
  total: number;
  unread: number;
  needsReply: number;
  inbound: number;
  outbound: number;
}

export interface ReplyData {
  body: string;
  cc?: string[];
}

export type EmailFilter = 'all' | 'inbound' | 'outbound' | 'needs_reply';
