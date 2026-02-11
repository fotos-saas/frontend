/**
 * Tanár archívum interface-ek és típusok.
 */

export interface TeacherListItem {
  id: number;
  canonicalName: string;
  titlePrefix: string | null;
  position: string | null;
  fullDisplayName: string;
  schoolId: number;
  schoolName: string | null;
  isActive: boolean;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  aliasesCount: number;
  photosCount: number;
}

export interface TeacherAlias {
  id: number;
  aliasName: string;
}

export interface TeacherPhoto {
  id: number;
  mediaId: number;
  year: number;
  isActive: boolean;
  url: string | null;
  thumbUrl: string | null;
  fileName: string | null;
}

export interface TeacherDetail {
  id: number;
  canonicalName: string;
  titlePrefix: string | null;
  position: string | null;
  fullDisplayName: string;
  schoolId: number;
  schoolName: string | null;
  isActive: boolean;
  notes: string | null;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  aliases: TeacherAlias[];
  photos: TeacherPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherChangeLogEntry {
  id: number;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  userName: string | null;
  createdAt: string;
}

export interface CreateTeacherRequest {
  canonical_name: string;
  title_prefix?: string | null;
  position?: string | null;
  school_id: number;
  aliases?: string[];
  notes?: string | null;
}

export interface UpdateTeacherRequest {
  canonical_name?: string;
  title_prefix?: string | null;
  position?: string | null;
  school_id?: number;
  aliases?: string[];
  notes?: string | null;
  is_active?: boolean;
}

// Bulk import types

export type BulkImportMatchType = 'exact' | 'fuzzy' | 'ai' | 'ai_sonnet' | 'no_match';
export type BulkImportAction = 'create' | 'update' | 'skip';

export interface BulkImportPreviewItem {
  inputName: string;
  matchType: BulkImportMatchType;
  teacherId: number | null;
  teacherName: string | null;
  photoUrl: string | null;
  confidence: number;
}

export interface BulkImportExecuteItem {
  input_name: string;
  action: BulkImportAction;
  teacher_id: number | null;
}

export interface BulkImportExecuteResult {
  created: number;
  updated: number;
  skipped: number;
}

// Projekt nézet types

export interface TeacherInProject {
  personId: number | null;
  personName: string;
  archiveId: number | null;
  hasPhoto: boolean;
  photoThumbUrl: string | null;
  photoUrl: string | null;
}

export interface TeacherProjectGroup {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
  teacherCount: number;
  missingPhotoCount: number;
  teachers: TeacherInProject[];
}

export interface TeacherProjectSummary {
  totalProjects: number;
  totalTeachers: number;
  withPhoto: number;
  missingPhoto: number;
}

export interface TeachersByProjectResponse {
  projects: TeacherProjectGroup[];
  summary: TeacherProjectSummary;
}
