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
