/**
 * Booking Calendar - Frontend TypeScript interfészek
 */

// ============================================================
// ENUMS
// ============================================================

export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'canceled' | 'no_show';
export type BookingSource = 'manual' | 'public_link' | 'csv_import' | 'recurring' | 'widget';
export type LocationType = 'on_site' | 'studio' | 'online' | 'flexible';
export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'scheduled' | 'sent' | 'failed' | 'canceled';
export type WaitlistStatus = 'waiting' | 'notified' | 'accepted' | 'expired' | 'canceled';
export type CalendarView = 'daily' | 'weekly' | 'monthly';
export type SyncDirection = 'google_to_ps' | 'ps_to_google' | 'both';

// ============================================================
// SESSION TYPES
// ============================================================

export interface SessionType {
  id: number;
  key: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_after_minutes: number;
  color: string;
  icon: string | null;
  sort_order: number;
  price: number | null;
  location_type: LocationType;
  default_location: string | null;
  max_participants: number | null;
  requires_approval: boolean;
  auto_confirm: boolean;
  is_public: boolean;
  is_active: boolean;
  min_notice_hours: number | null;
  max_advance_days: number | null;
  prep_guide: string | null;
  bookings_count?: number;
  questionnaire_fields?: QuestionnaireField[];
}

export interface SessionTypeForm {
  key: string;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_after_minutes?: number;
  color: string;
  icon?: string;
  price?: number;
  location_type: LocationType;
  default_location?: string;
  max_participants?: number;
  requires_approval: boolean;
  auto_confirm: boolean;
  is_public: boolean;
  min_notice_hours?: number;
  max_advance_days?: number;
  prep_guide?: string;
  questionnaire_fields?: QuestionnaireFieldForm[];
}

export interface SessionTypeTemplate {
  key: string;
  name: string;
  description: string;
  duration_minutes: number;
  color: string;
  icon: string;
  location_type: LocationType;
}

// ============================================================
// QUESTIONNAIRE
// ============================================================

export interface QuestionnaireField {
  id: number;
  field_key: string;
  field_type: 'text' | 'select' | 'checkbox' | 'textarea' | 'number' | 'file';
  label: string;
  placeholder: string | null;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
}

export interface QuestionnaireFieldForm {
  field_key: string;
  field_type: 'text' | 'select' | 'checkbox' | 'textarea' | 'number' | 'file';
  label: string;
  placeholder?: string;
  is_required: boolean;
  options?: string[];
  sort_order: number;
}

export interface QuestionnaireAnswer {
  field_key: string;
  label: string;
  value: string | null;
  file_path?: string | null;
}

// ============================================================
// AVAILABILITY
// ============================================================

export interface AvailabilityPattern {
  id?: number;
  day_of_week: number;
  day_name?: string;
  is_enabled: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface AvailabilityOverride {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  note: string | null;
}

export interface BlockedDate {
  id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  source: 'manual' | 'google_calendar' | 'hungarian_holidays';
}

export interface AvailabilitySettings {
  buffer_minutes: number;
  max_daily: number;
  min_notice_hours: number;
  max_advance_days: number;
}

export interface AvailabilityResponse {
  patterns: AvailabilityPattern[];
  overrides: AvailabilityOverride[];
  blocked_dates: BlockedDate[];
  settings: AvailabilitySettings;
}

// ============================================================
// BOOKINGS
// ============================================================

export interface Booking {
  id: number;
  uuid: string;
  booking_number: string;
  session_type: SessionType;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: BookingStatus;
  status_changed_at: string | null;
  cancellation_reason: string | null;
  school_name: string | null;
  class_name: string | null;
  student_count: number | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  location: string | null;
  location_type: LocationType | null;
  notes: string | null;
  internal_notes: string | null;
  source: BookingSource;
  assigned_user_id: number | null;
  completed_at: string | null;
  gallery_link_sent_at: string | null;
  created_at: string;
  questionnaire_answers?: QuestionnaireAnswer[];
  notifications?: BookingNotification[];
}

export interface BookingForm {
  session_type_id: number;
  date: string;
  start_time: string;
  school_name?: string;
  class_name?: string;
  student_count?: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  location?: string;
  notes?: string;
  internal_notes?: string;
  send_confirmation?: boolean;
  questionnaire_answers?: Record<string, unknown>;
}

export interface BookingConflict {
  type: 'time_overlap' | 'buffer_overlap' | 'daily_limit' | 'google_event' | 'blocked_date';
  booking_id?: number;
  booking_number?: string;
  message: string;
  count?: number;
  max?: number;
  event_title?: string;
  reason?: string;
}

export interface BookingCreateResponse {
  booking: Booking;
  conflicts: BookingConflict[];
  notifications_scheduled?: { type: string; channel: string; scheduled_at: string }[];
}

export interface BookingConflictResponse {
  message: string;
  conflicts: BookingConflict[];
  suggestions: TimeSlot[];
}

// ============================================================
// CALENDAR
// ============================================================

export interface TimeSlot {
  start_time: string;
  end_time: string;
  date?: string;
}

export interface DailyStat {
  count: number;
  max: number;
  percentage: number;
}

export interface GoogleEvent {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface CalendarResponse {
  bookings: Booking[];
  availability: {
    patterns: AvailabilityPattern[];
    overrides: AvailabilityOverride[];
  };
  blocked_dates: BlockedDate[];
  google_events: GoogleEvent[];
  daily_stats: Record<string, DailyStat>;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface BookingNotification {
  id: number;
  type: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  subject: string | null;
}

// ============================================================
// WAITLIST
// ============================================================

export interface WaitlistEntry {
  id: number;
  preferred_date: string;
  session_type: { name: string; color: string };
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: WaitlistStatus;
  position: number;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// ============================================================
// BATCH IMPORT
// ============================================================

export interface BatchImportRow {
  row_number: number;
  status: 'valid' | 'warning' | 'error';
  data: {
    class_name: string;
    student_count: number;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    date: string;
    start_time: string;
    notes?: string;
  };
  warnings: string[];
  errors: string[];
  suggestion: TimeSlot | null;
}

export interface BatchImportParseResponse {
  rows: BatchImportRow[];
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
  };
}

export interface BatchImportExecuteRow {
  row_number: number;
  data: BatchImportRow['data'];
  accepted: boolean;
  use_suggestion?: boolean;
  suggestion?: TimeSlot;
}

// ============================================================
// STATS
// ============================================================

export interface BookingStats {
  period: { start: string; end: string };
  totals: {
    bookings: number;
    confirmed: number;
    completed: number;
    canceled: number;
    no_show: number;
    students_total: number;
  };
  capacity: {
    total_slots: number;
    used_slots: number;
    percentage: number;
    forecast_percentage: number;
  };
  revenue: {
    confirmed: number;
    forecast: number;
  };
  no_show_rate: number;
  avg_lead_time_days: number;
  top_session_type: string;
  busiest_day: string;
  conversion_rate: number;
  by_session_type: {
    key: string;
    name: string;
    count: number;
    revenue: number;
  }[];
  daily_breakdown: {
    date: string;
    count: number;
    percentage: number;
  }[];
}

export interface NoShowStats {
  rate: number;
  rate_change: number;
  top_schools: {
    school_name: string;
    rate: number;
    count: number;
  }[];
  monthly_trend: {
    month: string;
    rate: number;
  }[];
}

// ============================================================
// PAGE SETTINGS
// ============================================================

export interface BookingPageSettings {
  booking_slug: string | null;
  page_settings: {
    logo_url?: string;
    primary_color?: string;
    background_image_url?: string;
    welcome_text?: string;
    footer_text?: string;
    show_price?: boolean;
    dark_mode?: boolean;
  } | null;
}

// ============================================================
// GOOGLE CALENDAR
// ============================================================

export interface GoogleCalendarStatus {
  connected: boolean;
  google_email?: string;
  calendar_ids?: string[];
  sync_direction?: SyncDirection;
  last_synced_at?: string;
  webhook_active?: boolean;
}

// ============================================================
// PUBLIC BOOKING
// ============================================================

export interface PublicBookingPartner {
  name: string;
  slug: string;
  page_settings: BookingPageSettings['page_settings'];
}

export interface PublicAvailableDate {
  date: string;
  available: boolean;
  slots_count?: number;
  reason?: string;
}

export interface PublicBookingConfirmation {
  booking: {
    uuid: string;
    booking_number: string;
    status: BookingStatus;
    session_type_name: string;
    date: string;
    start_time: string;
    end_time: string;
    contact_name: string;
  };
  message: string;
  calendar_links: {
    google: string;
    ics: string;
  };
}

// ============================================================
// STATUS HELPERS
// ============================================================

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: string }> = {
  requested: { label: 'Kérelem', color: 'amber', icon: 'clock' },
  confirmed: { label: 'Visszaigazolt', color: 'green', icon: 'check-circle' },
  completed: { label: 'Teljesített', color: 'blue', icon: 'check-circle' },
  canceled: { label: 'Lemondott', color: 'gray', icon: 'x-circle' },
  no_show: { label: 'Nem jelent meg', color: 'red', icon: 'alert-circle' },
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  on_site: 'Helyszíni',
  studio: 'Stúdió',
  online: 'Online',
  flexible: 'Rugalmas',
};
