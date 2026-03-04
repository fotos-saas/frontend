import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PublicBookingPartner, SessionType, PublicAvailableDate,
  TimeSlot, PublicBookingConfirmation,
} from '../../partner/models/booking.models';

/** Foglalasi urlap adatok */
export interface BookingFormData {
  session_type_id: number;
  date: string;
  start_time: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  school_name?: string;
  class_name?: string;
  student_count?: number;
  notes?: string;
  questionnaire_answers?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Varolista feliratkozas adatok */
export interface WaitlistFormData {
  session_type_id: number;
  preferred_date: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
}

/** Atidozezes adatok */
export interface RescheduleData {
  date: string;
  start_time: string;
}

/** Lemondas adatok */
export interface CancelData {
  reason?: string;
}

/** Varolista valasz */
export interface WaitlistResponse {
  position: number;
  message: string;
}

/** Atidozezes/lemondas valasz */
export interface BookingActionResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/public/booking`;

  getPartner(slug: string): Observable<{ data: { partner: PublicBookingPartner; session_types: SessionType[] } }> {
    return this.http.get<{ data: { partner: PublicBookingPartner; session_types: SessionType[] } }>(`${this.baseUrl}/${slug}`);
  }

  getAvailableDates(slug: string, sessionTypeId: number, month: string): Observable<{ data: PublicAvailableDate[] }> {
    return this.http.get<{ data: PublicAvailableDate[] }>(`${this.baseUrl}/${slug}/available-dates`, {
      params: { session_type_id: String(sessionTypeId), month }
    });
  }

  getAvailableSlots(slug: string, sessionTypeId: number, date: string): Observable<{ data: TimeSlot[] }> {
    return this.http.get<{ data: TimeSlot[] }>(`${this.baseUrl}/${slug}/available-slots`, {
      params: { session_type_id: String(sessionTypeId), date }
    });
  }

  book(slug: string, data: BookingFormData): Observable<{ data: PublicBookingConfirmation }> {
    return this.http.post<{ data: PublicBookingConfirmation }>(`${this.baseUrl}/${slug}/book`, data);
  }

  joinWaitlist(slug: string, data: WaitlistFormData): Observable<{ data: WaitlistResponse }> {
    return this.http.post<{ data: WaitlistResponse }>(`${this.baseUrl}/${slug}/waitlist`, data);
  }

  reschedule(slug: string, bookingUuid: string, data: RescheduleData): Observable<{ data: BookingActionResponse }> {
    return this.http.put<{ data: BookingActionResponse }>(`${this.baseUrl}/${slug}/reschedule/${bookingUuid}`, data);
  }

  cancel(slug: string, bookingUuid: string, data: CancelData): Observable<{ data: BookingActionResponse }> {
    return this.http.post<{ data: BookingActionResponse }>(`${this.baseUrl}/${slug}/cancel/${bookingUuid}`, data);
  }

  downloadIcs(slug: string, bookingUuid: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${slug}/ics/${bookingUuid}`, { responseType: 'blob' });
  }
}
