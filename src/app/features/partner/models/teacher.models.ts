/**
 * Tanár archívum interface-ek és típusok.
 */

export interface TeacherGroupRow {
  primary: TeacherListItem;
  members: TeacherListItem[];
  linkedGroup: string | null;
}

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
  photoMiniThumbUrl: string | null;
  photoUrl: string | null;
  aliasesCount: number;
  photosCount: number;
  linkedGroup: string | null;
  groupSize: number;
}

// Tanár összekapcsolás (linking) types

export interface TeacherLinkedGroup {
  linkedGroup: string;
  teachers: TeacherLinkedGroupItem[];
}

export interface TeacherLinkedGroupItem {
  id: number;
  canonicalName: string;
  titlePrefix: string | null;
  fullDisplayName: string;
  schoolName: string | null;
  photoThumbUrl: string | null;
  photoMiniThumbUrl: string | null;
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

export interface TeacherProject {
  projectId: number;
  className: string | null;
  classYear: string | null;
  schoolName: string | null;
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
  projects: TeacherProject[];
  linkedGroup: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedGroupPhoto {
  mediaId: number;
  teacherName: string;
  schoolName: string | null;
  year: number;
  thumbUrl: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number;
  md5Hash: string | null;
  createdAt: string | null;
  duplicateCount: number;
  isActive: boolean;
  isPortraitProcessed?: boolean;
}

export interface LinkTeachersResponse {
  linkedGroup: string;
  photos: LinkedGroupPhoto[];
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

// Iskola nézet types (tanárok iskolánként csoportosítva)

export interface TeacherInSchool {
  archiveId: number;
  name: string;
  hasPhoto: boolean;
  hasSyncablePhoto: boolean;
  noPhotoMarked: boolean;
  photoThumbUrl: string | null;
  photoMiniThumbUrl: string | null;
  photoUrl: string | null;
  photoFileName?: string | null;
  photoTakenAt?: string | null;
  schoolId?: number;
}

export interface SchoolClassInfo {
  projectId: number;
  className: string | null;
  classYear: string | null;
}

export interface TeacherSchoolGroup {
  schoolId: number;
  schoolName: string;
  classes: SchoolClassInfo[];
  classCount: number;
  teacherCount: number;
  missingPhotoCount: number;
  hasTeacherPersons: boolean;
  syncAvailable: boolean;
  teachers: TeacherInSchool[];
}

export interface TeacherSchoolSummary {
  totalSchools: number;
  totalTeachers: number;
  withPhoto: number;
  missingPhoto: number;
}

export interface TeachersBySchoolResponse {
  schools: TeacherSchoolGroup[];
  summary: TeacherSchoolSummary;
}

// Tanár fotó szinkronizálás request
export interface SyncTeacherRequest {
  school_id: number;
  class_year?: string;
  archive_ids?: number[];
}

// Tanár fotó szinkronizálás types

export type SyncPreviewStatus = 'syncable' | 'no_match' | 'no_photo' | 'already_has_photo';

export interface SyncPreviewItem {
  archiveId: number;
  personName: string;
  status: SyncPreviewStatus;
  matchType?: string;
  teacherName?: string;
  teacherId?: number;
  confidence?: number;
  photoThumbUrl?: string;
}

export interface SyncPreviewResponse {
  syncable: number;
  noMatch: number;
  noPhoto: number;
  alreadyHasPhoto: number;
  total: number;
  details: SyncPreviewItem[];
}

export type SyncResultStatus = 'synced' | 'no_match' | 'no_photo';

export interface SyncResultItem {
  archiveId: number;
  personName: string;
  status: SyncResultStatus;
  sourceSchoolId?: number;
  photoUrl?: string;
  photoThumbUrl?: string;
  photoFileName?: string;
  photoTakenAt?: string;
}

export interface SyncExecuteResponse {
  synced: number;
  noMatch: number;
  noPhoto: number;
  skipped: number;
  details: SyncResultItem[];
}

// Upload History típusok (Feltöltési előzmények)

export interface TeacherUploadHistoryItem {
  teacherId: number;
  teacherName: string;
  photoThumbUrl: string | null;
  fileName: string | null;
  uploadedAt: string;
}

export interface TeacherUploadHistorySchool {
  schoolId: number;
  schoolName: string;
  uploads: TeacherUploadHistoryItem[];
}

export interface TeacherUploadHistoryDay {
  date: string;
  isNew: boolean;
  uploadCount: number;
  schools: TeacherUploadHistorySchool[];
}

export interface TeacherUploadHistoryResponse {
  days: TeacherUploadHistoryDay[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  unseenCount: number;
}
