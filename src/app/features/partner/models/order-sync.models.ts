/**
 * Megrendelés szinkronizálás interfészek.
 */

export type OrderSyncStatus = 'pending' | 'synced' | 'failed' | 'needs_review' | null;
export type TeacherMatchType = 'exact' | 'fuzzy' | 'ai' | 'ai_sonnet' | 'no_match' | null;

export interface OrderSyncData {
  syncStatus: OrderSyncStatus;
  syncedAt: string | null;
  aiConfidence: number | null;
  warnings: string[];
  files: {
    orderForm: OrderSyncFile;
    background: OrderSyncFile;
    otherFile: OrderSyncFile;
  };
  parsedStudents: ParsedStudent[];
  parsedTeachers: ParsedTeacher[];
  rawStudentDescription: string | null;
  rawTeacherDescription: string | null;
  teacherMatches: TeacherMatch[];
}

export interface OrderSyncFile {
  url: string | null;
  exists: boolean;
}

export interface ParsedStudent {
  id: number;
  name: string;
  note: string;
}

export interface ParsedTeacher {
  id: number;
  name: string;
  title: string;
  matchType: TeacherMatchType;
  archiveId: number | null;
  confidence: number;
}

export interface TeacherMatch {
  inputName: string;
  matchType: TeacherMatchType;
  teacherId: number | null;
  teacherName: string | null;
  photoUrl: string | null;
  confidence: number;
}

export interface UpdateRosterPayload {
  students?: { name: string; note?: string }[];
  teachers?: { name: string; title?: string }[];
}
