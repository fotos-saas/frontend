import { TokenType } from '../services/token.service';

/**
 * Kapcsolattartó interface (ügyintéző vagy iskolai kapcsolattartó)
 */
export interface ContactPerson {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Tablo személy interface (diák vagy tanár)
 */
export interface TabloPerson {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  localId: string | null;
  hasPhoto: boolean;
}

/**
 * @deprecated Use TabloPerson instead
 */
export type MissingPerson = TabloPerson;

/**
 * Személyek statisztika
 */
export interface PersonStats {
  total: number;
  withoutPhoto: number;
  studentsWithoutPhoto: number;
  teachersWithoutPhoto: number;
}

/**
 * @deprecated Use PersonStats instead
 */
export type MissingStats = PersonStats;

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
 * Photo selection progress interface
 * A reminder step intelligens meghatározásához
 */
export interface PhotoSelectionProgress {
  claimedCount: number;
  retouchCount: number;
  hasTabloPhoto: boolean;
}

/**
 * Tablo projekt adatok interface
 */
export interface TabloProject {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
  /** Partner ID (Sentry context-hez) */
  partnerId?: number | null;
  partnerName?: string | null;
  partnerEmail?: string | null;
  partnerPhone?: string | null;
  coordinators?: ContactPerson[];
  contacts?: ContactPerson[];
  hasOrderData?: boolean;
  /** Van-e leadott megrendelés elemzés (completed status) */
  hasOrderAnalysis?: boolean;
  lastActivityAt?: string | null;
  photoDate?: string | null;
  deadline?: string | null;
  /** @deprecated Use persons instead */
  missingPersons?: TabloPerson[];
  /** Projekt személyei (diákok és tanárok) */
  persons?: TabloPerson[];
  /** @deprecated Use personStats instead */
  missingStats?: PersonStats;
  /** Személyek statisztika */
  personStats?: PersonStats;
  /** Has persons flag for navbar menu */
  hasPersons?: boolean;
  /** @deprecated Use hasPersons instead */
  hasMissingPersons?: boolean;
  /** Has template chooser flag for navbar menu */
  hasTemplateChooser?: boolean;
  /** Number of selected templates (0 = none selected yet) */
  selectedTemplatesCount?: number;
  /** Tablo status object */
  tabloStatus?: TabloStatus | null;
  /** User-facing status message set by admin (legacy) */
  userStatus?: string | null;
  /** Status color: info, warning, success, danger, gray (legacy) */
  userStatusColor?: string | null;
  /** Share URL if sharing is enabled */
  shareUrl?: string | null;
  /** Whether sharing is enabled */
  shareEnabled?: boolean;
  /** Már véglegesítve lett-e a terv */
  isFinalized?: boolean;
  /** Minták száma (ha > 0, akkor nem kell véglegesítés) */
  samplesCount?: number;
  /** Aktív szavazások száma (ha > 0, megjelenik a Szavazások menüpont) */
  activePollsCount?: number;
  /** Elvárt osztálylétszám (részvételi arány számításhoz) */
  expectedClassSize?: number | null;
  /** Képválasztás elérhető-e (tablo workflow enabled) */
  hasPhotoSelection?: boolean;
  /** Work session ID a képválasztáshoz */
  workSessionId?: number | null;
  /** Galéria ID (ha nincs work session, de van galéria) */
  tabloGalleryId?: number | null;
  /** Van-e galéria csatolva a projekthez */
  hasGallery?: boolean;
  /** Képválasztás véglegesítve van-e */
  photoSelectionFinalized?: boolean;
  /** Képválasztás aktuális lépése */
  photoSelectionCurrentStep?: 'claiming' | 'retouch' | 'tablo' | 'completed' | null;
  /** Képválasztás progress (intelligens reminder step meghatározáshoz) */
  photoSelectionProgress?: PhotoSelectionProgress | null;
}

/**
 * Bejelentkezett felhasználó interface
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  type: 'tablo-guest' | 'marketer' | 'registered';
  /** Felhasználói szerepkörök (Spatie roles) */
  roles?: string[];
  /** Jelszó be van-e állítva (QR regisztráció után false) */
  passwordSet?: boolean;
  /** Van-e Partner rekord az adatbázisban */
  has_partner?: boolean;
  /** Partner ID (marketer/partner felhasználóknál) */
  partner_id?: number | null;
}

/**
 * Login API válasz interface
 */
export interface LoginResponse {
  user: AuthUser;
  project?: TabloProject;
  token: string;
  /** Token típus: code (kódos), share (megosztás), preview (előnézet), client (partner ügyfél) */
  tokenType?: TokenType;
  /** Véglegesíthet-e (csak kódos belépés esetén true) */
  canFinalize?: boolean;
  /** Guest session a poke rendszerhez (kódos belépés esetén) */
  guestSession?: {
    sessionToken: string;
    guestName: string;
  };
  /** Visszaállított guest session (magic link restore esetén) */
  restoredSession?: {
    sessionToken: string;
    guestName: string;
    guestEmail: string | null;
  };
  /** Login típus - melyik oldalra irányítson: 'tablo' | 'client' */
  loginType?: 'tablo' | 'client';
  /** Partner client adatok (client login esetén) */
  client?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  /** Partner client albumok (client login esetén) */
  albums?: Array<{
    id: number;
    name: string;
    type: string;
    status: string;
    photosCount: number;
    maxSelections: number | null;
    minSelections: number | null;
    isCompleted: boolean;
  }>;
}

/**
 * Session validáció válasz
 */
export interface ValidateSessionResponse {
  valid: boolean;
  project?: TabloProject;
  message?: string;
  /** Token típus: code (kódos), share (megosztás), preview (előnézet) */
  tokenType?: TokenType;
  /** Véglegesíthet-e (csak kódos belépés esetén true) */
  canFinalize?: boolean;
  /** User info (jelszó állapot ellenőrzéséhez) */
  user?: {
    passwordSet?: boolean;
  };
}

// ==========================================
// NEW AUTH SYSTEM INTERFACES
// ==========================================

/**
 * Regisztrációs adatok
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

/**
 * Regisztrációs válasz
 */
export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  email_verification_required?: boolean;
}

/**
 * Jelszó változtatás adatok
 */
export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * Jelszó visszaállítás adatok
 */
export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * QR kód validációs válasz
 */
export interface QrCodeValidationResponse {
  valid: boolean;
  project?: {
    id: number;
    name: string;
    schoolName: string | null;
    className: string | null;
    classYear: string | null;
  };
  type?: string;
  typeLabel?: string;
  message?: string;
}

/**
 * QR regisztrációs adatok
 */
export interface QrRegistrationData {
  code: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Aktív session
 */
export interface ActiveSession {
  id: number;
  name: string;
  device_name: string | null;
  ip_address: string | null;
  login_method: 'password' | 'code' | 'magic_link' | 'qr_registration';
  created_at: string;
  last_used_at: string | null;
  is_current: boolean;
}

/**
 * 2FA setup válasz (előkészítés)
 */
export interface TwoFactorSetupResponse {
  available: boolean;
  message?: string;
  qr_code?: string;
  secret?: string;
}
