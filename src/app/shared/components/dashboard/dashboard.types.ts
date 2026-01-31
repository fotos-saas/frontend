import { Observable } from 'rxjs';

/**
 * Dashboard statisztikák közös típusa
 */
export interface DashboardStats {
  totalProjects: number;
  activeQrCodes: number;
  [key: string]: number | string | undefined;
}

/**
 * Projekt lista elem közös típusa
 */
export interface DashboardProjectItem {
  id: number;
  name: string;
  schoolName: string | null;
  hasActiveQrCode: boolean;
}

/**
 * Paginált response közös típus
 */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Dashboard service interface
 */
export interface IDashboardService {
  getStats(): Observable<DashboardStats>;
  getProjects(params: {
    per_page?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<PaginatedResponse<DashboardProjectItem>>;
}

/**
 * Stat kártya konfiguráció
 */
export interface StatCardConfig {
  icon: string;
  valueKey: string;
  label: string;
  clickable?: boolean;
}

/**
 * Quick action konfiguráció
 */
export interface QuickActionConfig {
  icon: string;
  label: string;
  route: string;
  primary?: boolean;
}
