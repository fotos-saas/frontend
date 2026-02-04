import { TabloPersonItem, UploadedPhoto } from '../../../services/partner.service';

/**
 * Személy kibővítve a hozzárendelt fotóval
 */
export interface PersonWithPhoto extends TabloPersonItem {
  assignedPhoto: UploadedPhoto | null;
  matchConfidence: 'high' | 'medium' | null;
  /** Már volt képe korábban (DB-ből) */
  hasExistingPhoto: boolean;
}
