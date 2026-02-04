/**
 * Guest Session and Onboarding Models
 *
 * Vendég azonosítás és regisztráció modellek az onboarding flow-hoz.
 */

// ==========================================
// PERSON SEARCH (Autocomplete)
// ==========================================

/**
 * Tablón szereplő személy (keresési eredmény)
 */
export interface PersonSearchResult {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  type_label: string;
  has_photo: boolean;
  is_claimed: boolean; // Már van-e hozzá verified session
}

/** @deprecated Use PersonSearchResult instead */
export type MissingPersonSearchResult = PersonSearchResult;

// ==========================================
// REGISTER WITH IDENTIFICATION (Onboarding)
// ==========================================

/**
 * Onboarding regisztráció request
 */
export interface RegisterWithIdentificationRequest {
  nickname: string;
  missing_person_id?: number;
  email?: string;
  device_identifier?: string;
}

/**
 * Onboarding regisztráció response
 */
export interface RegisterWithIdentificationResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    session_token: string;
    guest_name: string;
    guest_email: string | null;
    verification_status: VerificationStatus;
    is_pending: boolean;
    missing_person_id: number | null;
    missing_person_name: string | null;
  };
  has_conflict: boolean;
}

// ==========================================
// VERIFICATION STATUS (Pending Session)
// ==========================================

/**
 * Verifikáció státusz
 */
export type VerificationStatus = 'verified' | 'pending' | 'rejected';

/**
 * Verifikáció státusz response (polling)
 */
export interface VerificationStatusResponse {
  success: boolean;
  data?: {
    verification_status: VerificationStatus;
    is_verified: boolean;
    is_pending: boolean;
    is_rejected: boolean;
    is_banned: boolean;
    missing_person_name: string | null;
  };
}

// ==========================================
// EXTENDED GUEST SESSION
// ==========================================

/**
 * Bővített guest session (onboarding adatokkal)
 */
export interface ExtendedGuestSession {
  sessionToken: string;
  guestName: string;
  guestEmail: string | null;
  verificationStatus: VerificationStatus;
  isPending: boolean;
  /** @deprecated Use personId instead */
  missingPersonId: number | null;
  /** @deprecated Use personName instead */
  missingPersonName: string | null;
  // Alias for new naming
  personId?: number | null;
  personName?: string | null;
}

// ==========================================
// ADMIN - PENDING SESSIONS
// ==========================================

/**
 * Pending session admin listához
 */
export interface PendingSessionItem {
  id: number;
  guest_name: string;
  guest_email: string | null;
  missing_person: {
    id: number;
    name: string;
    type: 'student' | 'teacher';
    type_label: string;
  } | null;
  created_at: string;
  existing_owner: {
    id: number;
    guest_name: string;
  } | null;
}

/**
 * Pending sessions response
 */
export interface PendingSessionsResponse {
  success: boolean;
  data: PendingSessionItem[];
  count: number;
}

/**
 * Resolve conflict request
 */
export interface ResolveConflictRequest {
  approve: boolean;
}

/**
 * Resolve conflict response
 */
export interface ResolveConflictResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    verification_status: VerificationStatus;
    guest_name: string;
  };
}
