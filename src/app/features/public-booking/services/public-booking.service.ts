import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PublicBookingPartner, SessionType, PublicAvailableDate,
  TimeSlot, PublicBookingConfirmation,
} from '../../partner/models/booking.models';

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/public/booking`;

  getPartner(slug: string): Observable<{ data: { partner: PublicBookingPartner; session_types: SessionType[] } }> {
    return this.http.get<any>(`${this.baseUrl}/${slug}`);
  }

  getAvailableDates(slug: string, sessionTypeId: number, month: string): Observable<{ data: PublicAvailableDate[] }> {
    return this.http.get<any>(`${this.baseUrl}/${slug}/available-dates`, {
      params: { session_type_id: String(sessionTypeId), month }
    });
  }

  getAvailableSlots(slug: string, sessionTypeId: number, date: string): Observable<{ data: TimeSlot[] }> {
    return this.http.get<any>(`${this.baseUrl}/${slug}/available-slots`, {
      params: { session_type_id: String(sessionTypeId), date }
    });
  }

  book(slug: string, data: any): Observable<{ data: PublicBookingConfirmation }> {
    return this.http.post<any>(`${this.baseUrl}/${slug}/book`, data);
  }

  joinWaitlist(slug: string, data: any): Observable<{ data: any }> {
    return this.http.post<any>(`${this.baseUrl}/${slug}/waitlist`, data);
  }

  reschedule(slug: string, bookingUuid: string, data: any): Observable<{ data: any }> {
    return this.http.put<any>(`${this.baseUrl}/${slug}/reschedule/${bookingUuid}`, data);
  }

  cancel(slug: string, bookingUuid: string, data: any): Observable<{ data: any }> {
    return this.http.post<any>(`${this.baseUrl}/${slug}/cancel/${bookingUuid}`, data);
  }

  downloadIcs(slug: string, bookingUuid: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${slug}/ics/${bookingUuid}`, { responseType: 'blob' });
  }
}
