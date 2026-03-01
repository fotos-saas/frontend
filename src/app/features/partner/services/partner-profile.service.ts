import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProfileData {
  name: string;
  email: string;
  phone?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerProfileService {
  private http = inject(HttpClient);

  getProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(`${environment.apiUrl}/profile`);
  }

  updateProfile(data: Partial<ProfileData>): Observable<ProfileData> {
    return this.http.put<ProfileData>(`${environment.apiUrl}/profile`, data);
  }

  changePassword(data: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, data);
  }
}
