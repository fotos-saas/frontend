import { MissingPersonItem, UploadedPhoto } from '../../../services/partner.service';

/**
 * Személy kibővítve a hozzárendelt fotóval
 */
export interface PersonWithPhoto extends MissingPersonItem {
  assignedPhoto: UploadedPhoto | null;
  matchConfidence: 'high' | 'medium' | null;
  /** Már volt képe korábban (DB-ből) */
  hasExistingPhoto: boolean;
}
