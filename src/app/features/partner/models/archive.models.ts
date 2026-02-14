import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

// ============ Közös archive CRUD típusok ============

/**
 * Közös fotó interface (StudentPhoto és TeacherPhoto közös mezői)
 */
export interface ArchivePhoto {
  id: number;
  mediaId: number;
  year: number;
  isActive: boolean;
  url: string | null;
  thumbUrl: string | null;
  fileName: string | null;
}

/**
 * Közös alias interface
 */
export interface ArchiveAlias {
  id: number;
  aliasName: string;
}

/**
 * Közös archive detail interface (StudentDetail és TeacherDetail közös mezői).
 */
export interface ArchiveDetail {
  id: number;
  canonicalName: string;
  schoolId: number;
  schoolName: string | null;
  isActive: boolean;
  notes: string | null;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  aliases: ArchiveAlias[];
  photos: ArchivePhoto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Közös archive létrehozás payload (Create request közös mezői)
 */
export interface CreateArchivePayload {
  canonical_name: string;
  school_id: number;
  aliases?: string[];
  notes?: string | null;
  /** Student-specifikus */
  class_name?: string | null;
  /** Teacher-specifikus */
  title_prefix?: string | null;
  /** Teacher-specifikus */
  position?: string | null;
}

/**
 * Közös archive frissítés payload (Update request közös mezői)
 */
export interface UpdateArchivePayload {
  canonical_name?: string;
  school_id?: number;
  aliases?: string[];
  notes?: string | null;
  is_active?: boolean;
  /** Student-specifikus */
  class_name?: string | null;
  /** Teacher-specifikus */
  title_prefix?: string | null;
  /** Teacher-specifikus */
  position?: string | null;
}

// ============ Közös archive interfészek ============

export interface ArchivePersonInSchool {
  archiveId: number;
  name: string;
  className?: string | null;
  hasPhoto: boolean;
  hasSyncablePhoto?: boolean;
  noPhotoMarked: boolean;
  photoThumbUrl: string | null;
  photoMiniThumbUrl: string | null;
  photoUrl: string | null;
  photoFileName?: string | null;
  photoTakenAt?: string | null;
  schoolId?: number;
}

export interface ArchiveSchoolClassInfo {
  projectId: number;
  className: string | null;
  classYear: string | null;
}

export interface ArchiveSchoolGroup {
  schoolId: number;
  schoolName: string;
  classes: ArchiveSchoolClassInfo[];
  classCount: number;
  itemCount: number;
  missingPhotoCount: number;
  syncAvailable?: boolean;
  hasTeacherPersons?: boolean;
  items: ArchivePersonInSchool[];
}

export interface ArchiveClassGroup {
  className: string;
  displayName: string;
  studentCount: number;
  missingPhotoCount: number;
  items: ArchivePersonInSchool[];
}

export interface ArchiveSchoolSummary {
  totalSchools: number;
  totalItems: number;
  withPhoto: number;
  missingPhoto: number;
}

export interface ArchiveBySchoolResponse {
  schools: ArchiveSchoolGroup[];
  summary: ArchiveSchoolSummary;
}

// ============ Bulk import ============

export type ArchiveBulkImportAction = 'create' | 'update' | 'skip';

export interface ArchiveBulkImportPreviewItem {
  inputName: string;
  matchType: string;
  matchId: number | null;
  matchName: string | null;
  className?: string | null;
  photoUrl: string | null;
  confidence?: number;
}

export interface ArchiveBulkImportExecuteItem {
  input_name: string;
  action: ArchiveBulkImportAction;
  match_id: number | null;
}

export interface ArchiveBulkImportExecuteResult {
  created: number;
  updated: number;
  skipped: number;
}

// ============ Bulk photo upload ============

export type BulkPhotoMatchType = 'matched' | 'ambiguous' | 'unmatched';

export interface BulkPhotoMatchAlternative {
  person_id: number;
  person_name: string;
  confidence: number;
}

export interface BulkPhotoMatch {
  filename: string;
  person_id: number | null;
  person_name: string | null;
  match_type: BulkPhotoMatchType;
  confidence: number;
  alternatives: BulkPhotoMatchAlternative[];
  /** Frontend-only: manuálisan átírt person_id */
  overridden_person_id?: number | null;
  /** Frontend-only: kihagyás jelölő */
  skip?: boolean;
}

export interface BulkPhotoUploadSummary {
  uploaded: number;
  skipped: number;
  failed: number;
}

export interface BulkPhotoUploadResult {
  filename: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
}

// ============ Konfiguráció ============

export interface ArchiveField {
  name: string;
  label: string;
  type: 'text';
  placeholder?: string;
  gridSize?: 'sm' | 'lg';
}

export interface ArchiveConfig {
  entityLabel: string;
  entityLabelPlural: string;
  icon: string;
  isSyncable: boolean;
  placeholderName: string;
  extraFields: ArchiveField[];
  bulkImportMatchLabels: Record<string, string>;
  bulkImportHasConfidence: boolean;
  bulkImportTextareaLabel: string;
  bulkImportTextareaPlaceholder: string;
}

// ============ ArchiveService InjectionToken ============

export interface ArchiveService {
  uploadPhoto(id: number, file: File, year: number, setActive?: boolean): Observable<{ success: boolean; message: string; data: ArchivePhoto }>;
  getArchive(id: number): Observable<{ success: boolean; data: ArchiveDetail }>;
  createArchive(payload: CreateArchivePayload): Observable<{ success: boolean; message: string; data: ArchiveDetail }>;
  updateArchive(id: number, payload: UpdateArchivePayload): Observable<{ success: boolean; message: string; data: ArchiveDetail }>;
  getBySchool(params?: { class_year?: string; school_id?: number; missing_only?: boolean }): Observable<ArchiveBySchoolResponse>;
  getClassYears(): Observable<string[]>;
  bulkImportPreview(schoolId: number, names: string[]): Observable<{ success: boolean; data: ArchiveBulkImportPreviewItem[] }>;
  bulkImportPreviewFile(schoolId: number, file: File): Observable<{ success: boolean; data: ArchiveBulkImportPreviewItem[] }>;
  bulkImportExecute(schoolId: number, items: ArchiveBulkImportExecuteItem[]): Observable<{ success: boolean; message: string; data: ArchiveBulkImportExecuteResult }>;
  markNoPhoto(id: number): Observable<{ success: boolean; message: string }>;
  undoNoPhoto(id: number): Observable<{ success: boolean; message: string }>;
  bulkPhotoMatch(schoolId: number, year: number, filenames: string[]): Observable<{ success: boolean; data: BulkPhotoMatch[] }>;
  bulkPhotoUpload(schoolId: number, year: number, setActive: boolean, assignments: Record<string, number>, photos: File[]): Observable<{ success: boolean; data: { summary: BulkPhotoUploadSummary; results: BulkPhotoUploadResult[] } }>;
}

export const ARCHIVE_SERVICE = new InjectionToken<ArchiveService>('ArchiveService');
