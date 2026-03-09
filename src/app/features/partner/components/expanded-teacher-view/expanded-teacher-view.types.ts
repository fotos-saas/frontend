export interface ExpandedViewResponse {
  sessionId: number;
  projects: ExpandedProjectInfo[];
  uploadedPhotos: ExpandedUploadedPhoto[];
  classes: ExpandedClassData[];
  similarityGroups: SimilarityGroup[];
  availableProjects: ExpandedProjectInfo[];
}

export interface ExpandedProjectInfo {
  projectId: number;
  schoolName: string;
  className: string;
  isSource?: boolean;
  sameSchool?: boolean;
}

export interface ExpandedUploadedPhoto {
  id: number;
  filename: string;
  url: string;
  thumbUrl: string;
  iptcTitle?: string;
}

export interface ExpandedClassData {
  projectId: number;
  schoolId: number;
  schoolName: string;
  className: string;
  classYear: string;
  teachers: ExpandedClassTeacher[];
}

export interface ExpandedClassTeacher {
  personId: number;
  name: string;
  title: string | null;
  archiveId: number | null;
  hasPhoto: boolean;
  photoThumbUrl: string | null;
  hasOverride: boolean;
  linkedGroup: string | null;
  normalizedName: string;
  isPortraitProcessed?: boolean;
  isCropProcessed?: boolean;
}

export interface SimilarityGroup {
  type: 'exact' | 'prefix' | 'typo';
  normalizedName: string;
  variants: string[];
  persons: SimilarityPersonRef[];
}

export interface SimilarityPersonRef {
  personId: number;
  projectId: number;
  name: string;
}

export interface SyncResult {
  synced: number;
  results: SyncResultItem[];
  message: string;
}

export interface SyncResultItem {
  photoId: number;
  filename: string;
  matched: boolean;
  teachers: Array<{
    personId: number;
    name: string;
    projectId: number;
    className: string;
  }>;
}
