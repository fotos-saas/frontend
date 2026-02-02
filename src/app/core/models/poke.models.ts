/**
 * Poke Models
 *
 * Peer-to-peer bökés rendszer interfészei.
 */

import { ReactionEmoji } from '@shared/constants';

/**
 * Bökés kategóriák
 */
export type PokeCategory = 'voting' | 'photoshoot' | 'image_selection' | 'general';

/**
 * Bökés státusz
 */
export type PokeStatus = 'sent' | 'pending' | 'resolved' | 'expired';

/**
 * Preset üzenet interface
 */
export interface PokePreset {
  key: string;
  emoji: string;
  text: string;
  category: PokeCategory | null;
}

/**
 * Bökés felhasználó (minimális adat)
 */
export interface PokeUser {
  id: number;
  name: string;
}

/**
 * Bökés interface
 */
export interface Poke {
  id: number;
  from: PokeUser;
  target: PokeUser;
  category: PokeCategory;
  messageType: 'preset' | 'custom';
  emoji: string | null;
  text: string | null;
  status: PokeStatus;
  reaction: ReactionEmoji | null;
  isRead: boolean;
  reactedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * Napi limit info
 */
export interface PokeDailyLimit {
  sentToday: number;
  dailyLimit: number;
  remaining: number;
  hasReachedLimit: boolean;
}

/**
 * User bökés státusz (bökhető-e a user)
 */
export interface UserPokeStatus {
  canPoke: boolean;
  reason: string | null;
  reasonHu: string | null;
  totalPokesSent?: number;
  maxPokes?: number;
}

/**
 * Hiányzó felhasználó interface
 *
 * Két típusú lehet:
 * 1. Szavazásból hiányzó: TabloGuestSession alapú (van session, de nem szavazott)
 * 2. Fotózásból hiányzó: TabloMissingPerson alapú (lehet, hogy nincs session)
 */
export interface MissingUser {
  id: number;
  name: string;
  email: string | null;
  /** Szavazásnál: isExtra, Fotózásnál: undefined */
  isExtra?: boolean;
  /** Fotózásnál: 'student' | 'teacher', Szavazásnál: undefined */
  type?: 'student' | 'teacher';
  /** Van-e bejelentkezve (guest session) - fotózásnál fontos */
  hasGuestSession?: boolean;
  /** Guest session ID (bökéshez kell) - fotózásnál */
  guestSessionId?: number | null;
  lastActivityAt: string | null;
  hasActivity: boolean;
  createdAt?: string;
  pokeStatus: UserPokeStatus;
}

/**
 * Hiányzók kategória
 */
export interface MissingCategory {
  count: number;
  users: MissingUser[];
  hasActivePoll?: boolean;
  activePollsCount?: number;
  totalMissingPhotos?: number;
  message?: string;
}

/**
 * Hiányzók összesítés
 */
export interface MissingSummary {
  totalMissing: number;
  byCategory: {
    voting: number;
    photoshoot: number;
    imageSelection: number;
  };
}

/**
 * Hiányzók API response
 */
export interface MissingUsersResponse {
  categories: {
    voting: MissingCategory;
    photoshoot: MissingCategory;
    image_selection: MissingCategory;
  };
  summary: MissingSummary;
}

// ==========================================
// API Response interfaces (raw backend)
// ==========================================

export interface ApiPokeResponse {
  id: number;
  from: { id: number; name: string };
  target: { id: number; name: string };
  category: PokeCategory;
  messageType: 'preset' | 'custom';
  emoji: string | null;
  text: string | null;
  status: string;
  reaction: string | null;
  isRead: boolean;
  reactedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ApiPokePresetResponse {
  key: string;
  emoji: string;
  text: string;
  category: PokeCategory | null;
}

export interface ApiDailyLimitResponse {
  sent_today: number;
  daily_limit: number;
  remaining: number;
  has_reached_limit: boolean;
}

export interface ApiPokeStatusResponse {
  can_poke: boolean;
  reason: string | null;
  reason_hu: string | null;
  total_pokes_sent?: number;
  max_pokes?: number;
}

export interface ApiMissingUserResponse {
  id: number;
  name: string;
  email: string | null;
  /** Szavazásnál */
  is_extra?: boolean;
  /** Fotózásnál: 'student' | 'teacher' */
  type?: 'student' | 'teacher';
  /** Fotózásnál - van-e guest session */
  has_guest_session?: boolean;
  /** Fotózásnál - guest session ID */
  guest_session_id?: number | null;
  last_activity_at: string | null;
  has_activity: boolean;
  created_at?: string;
  poke_status: ApiPokeStatusResponse;
}

export interface ApiMissingCategoryResponse {
  count: number;
  users: ApiMissingUserResponse[];
  has_active_poll?: boolean;
  active_polls_count?: number;
  total_missing_photos?: number;
  message?: string;
}
