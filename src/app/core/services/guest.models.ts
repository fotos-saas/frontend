/**
 * Guest Service Models
 *
 * Interface-ek amelyeket korábban a guest.service.ts-bol exportáltunk.
 * Backward kompatibilitás miatt a guest.service.ts re-exportálja ezeket.
 */

/**
 * Guest session interface
 */
export interface GuestSession {
  id?: number;
  sessionToken: string;
  guestName: string;
  guestEmail: string | null;
}

/**
 * Guest regisztráció request
 */
export interface GuestRegisterRequest {
  guest_name: string;
  guest_email?: string;
  device_identifier?: string;
}

/**
 * Guest regisztráció response
 */
export interface GuestRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    session_token: string;
    guest_name: string;
    guest_email: string | null;
  };
}

/**
 * Guest validálás response
 */
export interface GuestValidateResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  data?: {
    id: number;
    session_token: string;
    guest_name: string;
    guest_email: string | null;
  };
}

/**
 * Guest update request
 */
export interface GuestUpdateRequest {
  session_token: string;
  guest_name: string;
  guest_email?: string;
}

/**
 * Guest update response
 */
export interface GuestUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    session_token: string;
    guest_name: string;
    guest_email: string | null;
  };
}

/**
 * Session status response (polling)
 */
export interface SessionStatusResponse {
  valid: boolean;
  reason?: 'banned' | 'deleted';
  message?: string;
}

/**
 * Session invalidated event
 */
export interface SessionInvalidatedEvent {
  reason: 'banned' | 'deleted' | 'rejected';
  message: string;
}
