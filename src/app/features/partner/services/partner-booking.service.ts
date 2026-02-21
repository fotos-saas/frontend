import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SessionType, SessionTypeForm, SessionTypeTemplate,
  AvailabilityResponse, AvailabilityPattern, AvailabilitySettings,
  AvailabilityOverride, BlockedDate,
  Booking, BookingForm, BookingCreateResponse,
  CalendarResponse, CalendarView,
  BookingStats, NoShowStats,
  BookingPageSettings,
  BatchImportParseResponse, BatchImportExecuteRow,
  WaitlistEntry,
  GoogleCalendarStatus,
  TimeSlot,
} from '../models/booking.models';

@Injectable({ providedIn: 'root' })
export class PartnerBookingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/booking`;

  // === SESSION TYPES ===
  getSessionTypes(): Observable<{ data: SessionType[] }> {
    return this.http.get<{ data: SessionType[] }>(`${this.baseUrl}/session-types`);
  }

  getSessionType(id: number): Observable<{ data: SessionType }> {
    return this.http.get<{ data: SessionType }>(`${this.baseUrl}/session-types/${id}`);
  }

  createSessionType(data: SessionTypeForm): Observable<{ data: SessionType }> {
    return this.http.post<{ data: SessionType }>(`${this.baseUrl}/session-types`, data);
  }

  updateSessionType(id: number, data: SessionTypeForm): Observable<{ data: SessionType }> {
    return this.http.put<{ data: SessionType }>(`${this.baseUrl}/session-types/${id}`, data);
  }

  deleteSessionType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/session-types/${id}`);
  }

  getSessionTypeTemplates(): Observable<{ data: SessionTypeTemplate[] }> {
    return this.http.get<{ data: SessionTypeTemplate[] }>(`${this.baseUrl}/session-types/templates`);
  }

  createFromTemplate(templateKey: string): Observable<{ data: SessionType }> {
    return this.http.post<{ data: SessionType }>(`${this.baseUrl}/session-types/from-template`, { template_key: templateKey });
  }

  // === AVAILABILITY ===
  getAvailability(): Observable<{ data: AvailabilityResponse }> {
    return this.http.get<{ data: AvailabilityResponse }>(`${this.baseUrl}/availability`);
  }

  updatePatterns(patterns: AvailabilityPattern[]): Observable<{ data: AvailabilityPattern[] }> {
    return this.http.put<{ data: AvailabilityPattern[] }>(`${this.baseUrl}/availability/patterns`, { patterns });
  }

  updateSettings(settings: Partial<AvailabilitySettings>): Observable<{ data: AvailabilitySettings }> {
    return this.http.put<{ data: AvailabilitySettings }>(`${this.baseUrl}/availability/settings`, settings);
  }

  createOverride(data: { date: string; start_time: string; end_time: string; note?: string }): Observable<{ data: AvailabilityOverride }> {
    return this.http.post<{ data: AvailabilityOverride }>(`${this.baseUrl}/availability/overrides`, data);
  }

  deleteOverride(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/availability/overrides/${id}`);
  }

  createBlockedDate(data: { start_date: string; end_date: string; reason?: string }): Observable<{ data: BlockedDate }> {
    return this.http.post<{ data: BlockedDate }>(`${this.baseUrl}/availability/blocked-dates`, data);
  }

  deleteBlockedDate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/availability/blocked-dates/${id}`);
  }

  // === BOOKINGS ===
  getBookings(params?: Record<string, string | number | boolean | undefined>): Observable<{ data: Booking[]; meta: Record<string, unknown> }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<{ data: Booking[]; meta: Record<string, unknown> }>(`${this.baseUrl}/bookings`, { params: httpParams });
  }

  getBooking(id: number): Observable<{ data: Booking }> {
    return this.http.get<{ data: Booking }>(`${this.baseUrl}/bookings/${id}`);
  }

  createBooking(data: BookingForm): Observable<BookingCreateResponse> {
    return this.http.post<BookingCreateResponse>(`${this.baseUrl}/bookings`, data);
  }

  updateBooking(id: number, data: Partial<BookingForm>): Observable<{ data: Booking }> {
    return this.http.put<{ data: Booking }>(`${this.baseUrl}/bookings/${id}`, data);
  }

  confirmBooking(id: number): Observable<{ data: Booking }> {
    return this.http.post<{ data: Booking }>(`${this.baseUrl}/bookings/${id}/confirm`, {});
  }

  cancelBooking(id: number, reason?: string): Observable<{ data: Booking }> {
    return this.http.post<{ data: Booking }>(`${this.baseUrl}/bookings/${id}/cancel`, { cancellation_reason: reason });
  }

  completeBooking(id: number): Observable<{ data: Booking }> {
    return this.http.post<{ data: Booking }>(`${this.baseUrl}/bookings/${id}/complete`, {});
  }

  markNoShow(id: number): Observable<{ data: Booking }> {
    return this.http.post<{ data: Booking }>(`${this.baseUrl}/bookings/${id}/no-show`, {});
  }

  rescheduleBooking(id: number, data: { date: string; start_time: string }): Observable<{ data: Booking }> {
    return this.http.post<{ data: Booking }>(`${this.baseUrl}/bookings/${id}/reschedule`, data);
  }

  getAvailableSlots(date: string, sessionTypeId: number): Observable<{ data: TimeSlot[] }> {
    return this.http.get<{ data: TimeSlot[] }>(`${this.baseUrl}/bookings/available-slots`, {
      params: { date, session_type_id: String(sessionTypeId) }
    });
  }

  // === CALENDAR ===
  getCalendar(startDate: string, endDate: string, view: CalendarView): Observable<{ data: CalendarResponse }> {
    return this.http.get<{ data: CalendarResponse }>(`${this.baseUrl}/calendar`, {
      params: { start_date: startDate, end_date: endDate, view }
    });
  }

  // === STATS ===
  getStats(startDate: string, endDate: string): Observable<{ data: BookingStats }> {
    return this.http.get<{ data: BookingStats }>(`${this.baseUrl}/stats`, {
      params: { start_date: startDate, end_date: endDate }
    });
  }

  getNoShowStats(startDate: string, endDate: string): Observable<{ data: NoShowStats }> {
    return this.http.get<{ data: NoShowStats }>(`${this.baseUrl}/stats/no-show`, {
      params: { start_date: startDate, end_date: endDate }
    });
  }

  // === PAGE SETTINGS ===
  getPageSettings(): Observable<{ data: BookingPageSettings }> {
    return this.http.get<{ data: BookingPageSettings }>(`${this.baseUrl}/page-settings`);
  }

  updatePageSettings(data: Partial<BookingPageSettings>): Observable<{ data: BookingPageSettings }> {
    return this.http.put<{ data: BookingPageSettings }>(`${this.baseUrl}/page-settings`, data);
  }

  // === BATCH IMPORT ===
  parseBatchImport(file: File, sessionTypeId: number): Observable<{ data: BatchImportParseResponse }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_type_id', String(sessionTypeId));
    return this.http.post<{ data: BatchImportParseResponse }>(`${this.baseUrl}/batch-import/parse`, formData);
  }

  executeBatchImport(rows: BatchImportExecuteRow[], sessionTypeId: number): Observable<{ data: { created: number; failed: number } }> {
    return this.http.post<{ data: { created: number; failed: number } }>(`${this.baseUrl}/batch-import/execute`, {
      rows,
      session_type_id: sessionTypeId,
    });
  }

  downloadBatchTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/batch-import/template`, { responseType: 'blob' });
  }

  // === WAITLIST ===
  getWaitlist(): Observable<{ data: WaitlistEntry[] }> {
    return this.http.get<{ data: WaitlistEntry[] }>(`${this.baseUrl}/waitlist`);
  }

  // === GOOGLE CALENDAR ===
  getGoogleCalendarStatus(): Observable<{ data: GoogleCalendarStatus }> {
    return this.http.get<{ data: GoogleCalendarStatus }>(`${this.baseUrl}/google-calendar/status`);
  }

  connectGoogleCalendar(): Observable<{ data: { auth_url: string } }> {
    return this.http.post<{ data: { auth_url: string } }>(`${this.baseUrl}/google-calendar/connect`, {});
  }

  syncGoogleCalendar(): Observable<{ data: { synced_events: number } }> {
    return this.http.post<{ data: { synced_events: number } }>(`${this.baseUrl}/google-calendar/sync`, {});
  }

  disconnectGoogleCalendar(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/google-calendar/disconnect`);
  }
}
