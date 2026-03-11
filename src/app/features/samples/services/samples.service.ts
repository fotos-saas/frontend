import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { TabloStatus } from '../../../shared/types/tablo.types';

// Re-export for backward compatibility
export type { TabloStatus } from '../../../shared/types/tablo.types';

/**
 * Minta kép interface
 */
export interface Sample {
  id: number;
  fileName: string;
  url: string;
  thumbUrl: string;
  description: string | null;
  createdAt: string;
}

/**
 * Samples API válasz
 */
export interface SamplesResponse {
  success: boolean;
  data: Sample[];
  totalCount: number;
}

/**
 * Projekt info interface
 */
export interface ProjectInfo {
  id: number;
  name: string;
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
  status: string;
  hasOrderAnalysis: boolean;
  samplesCount: number;
  hasMissingPersons: boolean;
  tabloStatus: TabloStatus | null;
  userStatus: string | null;
  userStatusColor: string | null;
}

/**
 * Project Info API válasz
 */
export interface ProjectInfoResponse {
  success: boolean;
  data: ProjectInfo;
}

/**
 * Samples Service - Mintaképek lekérése az API-ból
 */
@Injectable({
  providedIn: 'root'
})
export class SamplesService {

  constructor(private http: HttpClient) {}

  /**
   * Mintaképek lekérése (legújabb elől)
   */
  getSamples(): Observable<SamplesResponse> {
    return this.http.get<SamplesResponse>(`${environment.apiUrl}/tablo-frontend/samples`);
  }

  /**
   * Projekt info lekérése
   */
  getProjectInfo(): Observable<ProjectInfoResponse> {
    return this.http.get<ProjectInfoResponse>(`${environment.apiUrl}/tablo-frontend/project-info`);
  }
}
