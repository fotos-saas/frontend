/**
 * Monitoring személy adat (backend response)
 */
export interface MonitoringPerson {
  personId: number;
  name: string;
  type: 'student' | 'teacher';
  hasOpened: boolean;
  lastActivityAt: string | null;
  currentStep: string | null;
  workflowStatus: 'in_progress' | 'finalized' | null;
  retouchCount: number;
  hasTabloPhoto: boolean;
  finalizedAt: string | null;
  daysSinceLastActivity: number | null;
  staleWarning: boolean;
}

/**
 * Monitoring összefoglaló statisztika
 */
export interface MonitoringSummary {
  totalPersons: number;
  opened: number;
  notOpened: number;
  finalized: number;
  inProgress: number;
  staleCount: number;
}

/**
 * Monitoring API válasz
 */
export interface MonitoringResponse {
  persons: MonitoringPerson[];
  summary: MonitoringSummary;
}

/**
 * Szűrő opciók
 */
export type MonitoringFilter = 'all' | 'finalized' | 'in_progress' | 'not_started' | 'stale';
