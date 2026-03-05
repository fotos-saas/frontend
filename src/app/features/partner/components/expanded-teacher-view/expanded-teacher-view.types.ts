export interface ExpandedViewResponse {
  schools: ExpandedSchoolInfo[];
  archive: ExpandedArchiveData;
  classes: ExpandedClassData[];
  similarityGroups: SimilarityGroup[];
  availableSchools: ExpandedSchoolInfo[];
}

export interface ExpandedSchoolInfo {
  id: number;
  name: string;
  isLinked?: boolean;
}

export interface ExpandedArchiveData {
  teachers: ExpandedArchiveTeacher[];
  totalCount: number;
  withPhotoCount: number;
  missingPhotoCount: number;
}

export interface ExpandedArchiveTeacher {
  archiveId: number;
  name: string;
  schoolId: number;
  schoolName: string;
  hasPhoto: boolean;
  photoThumbUrl: string | null;
  photoUrl: string | null;
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
