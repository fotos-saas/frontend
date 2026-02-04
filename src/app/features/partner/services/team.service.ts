import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Csapattag interface
 */
export interface TeamMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: TeamRole;
  roleName: string;
  joinedAt: string;
}

/**
 * Függőben lévő meghívó interface
 */
export interface PendingInvitation {
  id: number;
  email: string;
  role: TeamRole;
  roleName: string;
  code: string;
  inviteUrl: string;
  createdAt: string;
  expiresAt: string | null;
}

/**
 * Csapattag szerepkörök
 */
export type TeamRole = 'designer' | 'marketer' | 'printer' | 'assistant';

/**
 * Szerepkörök listája (magyar nevekkel)
 */
export interface RoleOption {
  value: TeamRole;
  label: string;
  description: string;
}

/**
 * Csapat összefoglaló válasz
 */
export interface TeamResponse {
  members: TeamMember[];
  pendingInvitations: PendingInvitation[];
  roles: Record<TeamRole, string>;
}

/**
 * Meghívó létrehozás request
 */
export interface CreateInvitationRequest {
  email: string;
  role: TeamRole;
}

/**
 * Partner Team Service
 * API hívások a csapatkezeléshez.
 */
@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /**
   * Szerepkörök statikus listája
   */
  readonly roles: RoleOption[] = [
    {
      value: 'designer',
      label: 'Grafikus',
      description: 'Tablók tervezése, sablonok kezelése',
    },
    {
      value: 'marketer',
      label: 'Marketinges',
      description: 'Ügyfelek és projektek kezelése',
    },
    {
      value: 'printer',
      label: 'Nyomdász',
      description: 'Nyomtatási feladatok kezelése',
    },
    {
      value: 'assistant',
      label: 'Ügyintéző',
      description: 'Irodai adminisztráció',
    },
  ];

  /**
   * Csapat összefoglaló lekérése (tagok + meghívók)
   */
  getTeam(): Observable<TeamResponse> {
    return this.http.get<TeamResponse>(`${this.baseUrl}/team`);
  }

  /**
   * Új meghívó küldése
   */
  createInvitation(data: CreateInvitationRequest): Observable<{
    message: string;
    data: PendingInvitation;
  }> {
    return this.http.post<{ message: string; data: PendingInvitation }>(
      `${this.baseUrl}/invitations`,
      data
    );
  }

  /**
   * Meghívó visszavonása
   */
  revokeInvitation(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/invitations/${id}`
    );
  }

  /**
   * Meghívó újraküldése
   */
  resendInvitation(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/invitations/${id}/resend`,
      {}
    );
  }

  /**
   * Csapattag eltávolítása
   */
  removeTeamMember(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/team/${id}`
    );
  }

  /**
   * Csapattag szerepkörének módosítása
   */
  updateTeamMemberRole(id: number, role: TeamRole): Observable<{
    message: string;
    data: { id: number; role: TeamRole; roleName: string };
  }> {
    return this.http.put<{
      message: string;
      data: { id: number; role: TeamRole; roleName: string };
    }>(`${this.baseUrl}/team/${id}`, { role });
  }
}
