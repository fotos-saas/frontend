/**
 * Közös típusok a projekt részletek nézethez.
 * Marketer és Partner komponensek által is használható.
 */

/**
 * Kapcsolattartó interface
 */
export interface ProjectContact {
  id?: number;
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary?: boolean;
}

/**
 * Tablo Status interface
 */
export interface TabloStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
}

/**
 * QR kód interface
 */
export interface QrCode {
  id: number;
  code: string;
  type?: string;
  typeLabel?: string;
  usageCount: number;
  maxUsages: number | null;
  expiresAt: string | null;
  isValid: boolean;
  registrationUrl: string;
}

/**
 * Aktív QR kód (kompakt, áttekintéshez)
 */
export interface ActiveQrCode {
  id: number;
  code: string;
  type: string;
  typeLabel: string;
  usageCount: number;
  isValid: boolean;
  registrationUrl: string;
}

/**
 * QR kód előzmény (rövid)
 */
export interface QrCodeHistory {
  id: number;
  code: string;
  type?: string;
  typeLabel?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

/**
 * Személy preview elem a Névsor szekcióhoz.
 */
export interface PersonPreviewItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
  photoThumbUrl: string | null;
}

/**
 * Projekt részletek (közös interface marketer és partner számára)
 */
export interface ProjectDetailData {
  id: number;
  name: string;
  school: {
    id: number;
    name: string;
    city: string | null;
  } | null;
  partner: {
    id: number;
    name: string;
  } | null;
  className: string | null;
  classYear: string | null;
  status: string | null;
  statusLabel: string;
  statusColor?: string;
  tabloStatus: TabloStatus | null;
  photoDate: string | null;
  deadline: string | null;
  expectedClassSize: number | null;
  finalizedAt?: string | null;
  orderSubmittedAt?: string | null;
  draftPhotoCount?: number;
  contact: ProjectContact | null;
  contacts: ProjectContact[];
  qrCode: QrCode | null;
  activeQrCodes: ActiveQrCode[];
  qrCodesHistory: QrCodeHistory[];
  tabloGalleryId?: number | null;
  galleryPhotosCount?: number;
  personsCount?: number;
  studentsCount?: number;
  teachersCount?: number;
  studentsWithPhotoCount?: number;
  teachersWithPhotoCount?: number;
  personsPreview?: PersonPreviewItem[];
  createdAt: string;
  updatedAt: string;
}
