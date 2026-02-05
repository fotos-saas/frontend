/**
 * Bug Report Types
 *
 * Hibajelentő rendszer típusai.
 */

export type BugReportStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type BugReportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface BugReport {
  id: number;
  title: string;
  description: string;
  status: BugReportStatus;
  status_label: string;
  priority: BugReportPriority;
  priority_label: string;
  answered_by: 'admin' | 'ai' | null;
  first_viewed_at: string | null;
  attachments_count?: number;
  reporter?: BugReportReporter;
  attachments?: BugReportAttachment[];
  comments?: BugReportComment[];
  status_history?: BugReportStatusHistory[];
  created_at: string;
  updated_at: string;
}

export interface BugReportReporter {
  id: number;
  name: string;
  email: string;
}

export interface BugReportAttachment {
  id: number;
  url: string;
  original_filename: string;
  formatted_size: string;
  width: number | null;
  height: number | null;
}

export interface BugReportComment {
  id: number;
  content: string;
  is_internal?: boolean;
  author: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface BugReportStatusHistory {
  id: number;
  old_status: BugReportStatus | null;
  new_status: BugReportStatus;
  new_status_label: string;
  note: string | null;
  changed_by: {
    id: number;
    name: string;
  } | null;
  created_at: string;
}

export interface CreateBugReportDto {
  title: string;
  description: string;
  priority: BugReportPriority;
}

export interface UpdateBugReportStatusDto {
  status: BugReportStatus;
  note?: string;
}

export interface AddBugReportCommentDto {
  content: string;
  is_internal?: boolean;
}

export const BUG_REPORT_STATUS_OPTIONS: { value: BugReportStatus; label: string }[] = [
  { value: 'new', label: 'Új' },
  { value: 'in_progress', label: 'Folyamatban' },
  { value: 'resolved', label: 'Megoldva' },
  { value: 'closed', label: 'Lezárva' },
];

export const BUG_REPORT_PRIORITY_OPTIONS: { value: BugReportPriority; label: string }[] = [
  { value: 'low', label: 'Alacsony' },
  { value: 'medium', label: 'Közepes' },
  { value: 'high', label: 'Magas' },
  { value: 'critical', label: 'Kritikus' },
];
