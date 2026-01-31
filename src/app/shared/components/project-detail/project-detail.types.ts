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
  usageCount: number;
  maxUsages: number | null;
  expiresAt: string | null;
  isValid: boolean;
  registrationUrl: string;
}

/**
 * QR kód előzmény (rövid)
 */
export interface QrCodeHistory {
  id: number;
  code: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
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
  tabloStatus: TabloStatus | null;
  photoDate: string | null;
  deadline: string | null;
  expectedClassSize: number | null;
  contact: ProjectContact | null;
  contacts: ProjectContact[];
  qrCode: QrCode | null;
  qrCodesHistory: QrCodeHistory[];
  createdAt: string;
  updatedAt: string;
}
