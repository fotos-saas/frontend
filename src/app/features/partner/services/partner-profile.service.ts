import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProfileData {
  name: string;
  email: string;
  phone?: string | null;
}

export interface ProfileResponse {
  data: ProfileData;
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

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${environment.apiUrl}/profile`);
  }

  updateProfile(data: Partial<ProfileData>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${environment.apiUrl}/profile`, data);
  }

  changePassword(data: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, data);
  }
}
