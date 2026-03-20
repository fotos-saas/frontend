import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api.models';
import type {
  UsageState,
  TimeEntry,
  TimerState,
  CreateTimeEntryData,
  StartTimerData,
  StopTimerData,
} from '../models/time-credit.models';

/**
 * Time Credit Service.
 * Timer kezelés, usage meter, time entry CRUD.
 */
@Injectable({
  providedIn: 'root',
})
export class TimeCreditService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /** Aktív timerek — signal alapú, polling-gal frissül */
  readonly timers = signal<TimerState[]>([]);

  // --- Timer ---

  loadTimers(): Observable<TimerState[]> {
    return this.http
      .get<ApiResponse<TimerState[]>>(`${this.baseUrl}/timers`)
      .pipe(
        map((res) => {
          this.timers.set(res.data);
          return res.data;
        }),
      );
  }

  startTimer(data: StartTimerData): Observable<{ id: number; started_at: string }> {
    return this.http
      .post<ApiResponse<{ id: number; started_at: string }>>(`${this.baseUrl}/timers/start`, data)
      .pipe(map((res) => res.data));
  }

  pauseTimer(timerId: number): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/timers/${timerId}/pause`, {});
  }

  resumeTimer(timerId: number): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/timers/${timerId}/resume`, {});
  }

  stopTimer(timerId: number, data: StopTimerData = {}): Observable<{ id: number; minutes: number } | null> {
    return this.http
      .post<ApiResponse<{ id: number; minutes: number } | null>>(`${this.baseUrl}/timers/${timerId}/stop`, data)
      .pipe(map((res) => res.data));
  }

  stopAllTimers(): Observable<{ stopped_count: number }> {
    return this.http
      .post<ApiResponse<{ stopped_count: number }>>(`${this.baseUrl}/timers/stop-all`, {})
      .pipe(map((res) => res.data));
  }

  // --- Usage ---

  getUsage(projectId: number): Observable<UsageState> {
    return this.http
      .get<ApiResponse<UsageState>>(`${this.baseUrl}/projects/${projectId}/time-usage`)
      .pipe(map((res) => res.data));
  }

  // --- Time Entries ---

  getTimeEntries(projectId: number, page = 1): Observable<{ data: TimeEntry[]; total: number }> {
    return this.http
      .get<ApiResponse<{ data: TimeEntry[]; total: number }>>(
        `${this.baseUrl}/projects/${projectId}/time-entries`,
        { params: { page } },
      )
      .pipe(map((res) => res.data));
  }

  createTimeEntry(projectId: number, data: CreateTimeEntryData): Observable<{ id: number }> {
    return this.http
      .post<ApiResponse<{ id: number }>>(`${this.baseUrl}/projects/${projectId}/time-entries`, data)
      .pipe(map((res) => res.data));
  }

  deleteTimeEntry(projectId: number, entryId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/projects/${projectId}/time-entries/${entryId}`);
  }

  // --- Overage ---

  confirmOverage(projectId: number): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/projects/${projectId}/confirm-overage`, {});
  }
}
