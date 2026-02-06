import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DevLoginGenerateResponse {
  url: string;
  token: string;
  expiresIn: number;
}

export interface DevLoginConsumeResponse {
  user: {
    id: number;
    name: string;
    email: string | null;
    type: string;
    roles?: string[];
    passwordSet?: boolean;
    has_partner?: boolean;
    partner_id?: number | null;
    isRegistered?: boolean;
  };
  token: string;
  loginType: string;
  // Tablo fields
  project?: {
    id: number;
    name: string;
    schoolName: string | null;
    className: string;
    classYear: string;
    samplesCount: number;
    activePollsCount: number;
    contacts: { id: number; name: string; email: string | null; phone: string | null }[];
  };
  tokenType?: string;
  canFinalize?: boolean;
  guestSession?: {
    sessionToken: string;
    guestName: string;
  };
  // Client fields
  client?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    canRegister: boolean;
  };
  albums?: {
    id: number;
    name: string;
    type: string;
    status: string;
    photosCount: number;
    maxSelections: number | null;
    minSelections: number | null;
    isCompleted: boolean;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DevLoginService {
  private readonly http = inject(HttpClient);

  isDevMode(): boolean {
    return window.location.hostname === 'localhost';
  }

  generateDevLoginUrl(userType: string, identifier: number): Observable<DevLoginGenerateResponse> {
    return this.http.post<DevLoginGenerateResponse>(`${environment.apiUrl}/dev/login`, {
      user_type: userType,
      identifier
    });
  }

  consumeDevLogin(token: string): Observable<DevLoginConsumeResponse> {
    return this.http.get<DevLoginConsumeResponse>(`${environment.apiUrl}/dev/login/${token}`);
  }
}
