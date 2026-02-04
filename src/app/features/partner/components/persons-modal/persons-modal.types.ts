import { TabloPersonItem } from '../../services/partner.service';

export type TypeFilter = 'student' | 'teacher';

export interface PersonStats {
  total: number;
  students: number;
  teachers: number;
  withoutPhoto: number;
}

export { TabloPersonItem };

/**
 * @deprecated Use TabloPersonItem instead
 */
export type MissingPersonItem = TabloPersonItem;
