import { MissingPersonItem } from '../../services/partner.service';

export type TypeFilter = 'student' | 'teacher';

export interface MissingPersonStats {
  total: number;
  students: number;
  teachers: number;
  withoutPhoto: number;
}

export { MissingPersonItem };
