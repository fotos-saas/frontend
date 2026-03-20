/**
 * Time Credit System modellek.
 * Időkeret tracking, timer, usage meter.
 */

export interface UsageState {
  used_minutes: number;
  included_minutes: number;
  remaining_minutes: number;
  percentage: number;
  state: 'normal' | 'warning' | 'critical' | 'overage';
  overage_minutes: number;
  overage_started_hours: number;
  overage_cost: number;
  overage_rate: number;
  overage_confirmed: boolean;
  formatted: {
    used: string;
    included: string;
    remaining: string;
    overage: string;
  };
}

export interface TimeEntry {
  id: number;
  tablo_project_id: number;
  email_task_id: number | null;
  minutes: number;
  description: string;
  description_hu: string;
  entry_type: 'timer' | 'manual' | 'ai_estimated' | 'auto_stopped' | 'batch';
  work_type: string;
  student_name: string | null;
  is_billable: boolean;
  work_date: string;
  created_at: string;
}

export interface TimerState {
  id: number;
  is_running: boolean;
  is_paused: boolean;
  project_id: number;
  project_name: string;
  work_type: string | null;
  description: string | null;
  started_at: string;
  elapsed_seconds: number;
  elapsed_formatted: string;
  auto_stop_hours: number;
  auto_stop_at: string;
}

export interface CreateTimeEntryData {
  minutes: number;
  description: string;
  description_hu: string;
  work_type: string;
  student_name?: string;
  task_id?: number;
  work_date?: string;
}

export interface StartTimerData {
  project_id: number;
  work_type?: string;
  description?: string;
}

export interface StopTimerData {
  minutes?: number;
  description?: string;
  description_hu?: string;
  work_type?: string;
  student_name?: string;
  task_id?: number;
  discard?: boolean;
}

export const WORK_TYPES: { value: string; label: string }[] = [
  { value: 'face_swap', label: 'Arccsere' },
  { value: 'retouch', label: 'Retusálás' },
  { value: 'background_change', label: 'Háttércsere' },
  { value: 'text_correction', label: 'Szövegjavítás' },
  { value: 'layout_change', label: 'Elrendezés módosítás' },
  { value: 'color_adjustment', label: 'Szín korrekció' },
  { value: 'photo_replacement', label: 'Fotócsere' },
  { value: 'other', label: 'Egyéb' },
];
