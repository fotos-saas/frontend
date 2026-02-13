/**
 * Diák archívum interface-ek és típusok.
 */

export interface StudentListItem {
  id: number;
  canonicalName: string;
  className: string | null;
  schoolId: number;
  schoolName: string | null;
  isActive: boolean;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  aliasesCount: number;
  photosCount: number;
}

export interface StudentAlias {
  id: number;
  aliasName: string;
}

export interface StudentPhoto {
  id: number;
  mediaId: number;
  year: number;
  isActive: boolean;
  url: string | null;
  thumbUrl: string | null;
  fileName: string | null;
}

export interface StudentDetail {
  id: number;
  canonicalName: string;
  className: string | null;
  schoolId: number;
  schoolName: string | null;
  isActive: boolean;
  notes: string | null;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  aliases: StudentAlias[];
  photos: StudentPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentChangeLogEntry {
  id: number;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  userName: string | null;
  createdAt: string;
}

export interface CreateStudentRequest {
  canonical_name: string;
  class_name?: string | null;
  school_id: number;
  aliases?: string[];
  notes?: string | null;
}

export interface UpdateStudentRequest {
  canonical_name?: string;
  class_name?: string | null;
  school_id?: number;
  aliases?: string[];
  notes?: string | null;
  is_active?: boolean;
}

// Bulk import types

export type StudentBulkImportMatchType = 'exact' | 'no_match';
export type StudentBulkImportAction = 'create' | 'update' | 'skip';

export interface StudentBulkImportPreviewItem {
  inputName: string;
  matchType: StudentBulkImportMatchType;
  studentId: number | null;
  studentName: string | null;
  className: string | null;
  photoUrl: string | null;
}

export interface StudentBulkImportExecuteItem {
  input_name: string;
  action: StudentBulkImportAction;
  student_id: number | null;
}

export interface StudentBulkImportExecuteResult {
  created: number;
  updated: number;
  skipped: number;
}

// Iskola nézet types (diákok iskolánként csoportosítva)

export interface StudentInSchool {
  archiveId: number;
  name: string;
  className: string | null;
  hasPhoto: boolean;
  noPhotoMarked: boolean;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  schoolId?: number;
}

export interface SchoolClassInfo {
  projectId: number;
  className: string | null;
  classYear: string | null;
}

export interface StudentSchoolGroup {
  schoolId: number;
  schoolName: string;
  classes: SchoolClassInfo[];
  classCount: number;
  studentCount: number;
  missingPhotoCount: number;
  students: StudentInSchool[];
}

export interface StudentSchoolSummary {
  totalSchools: number;
  totalStudents: number;
  withPhoto: number;
  missingPhoto: number;
}

export interface StudentsBySchoolResponse {
  schools: StudentSchoolGroup[];
  summary: StudentSchoolSummary;
}
