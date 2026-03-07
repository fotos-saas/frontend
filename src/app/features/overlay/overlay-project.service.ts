import { Injectable, inject, NgZone, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OverlayContext } from '../../core/services/electron.types';
import { LoggerService } from '../../core/services/logger.service';

export interface ProjectMeta {
  schoolName: string;
  className: string;
  contactName: string;
  contactEmail: string;
  partnerName: string;
  partnerCompany: string;
  partnerEmail: string;
}

export interface PersonItem {
  id: number;
  name: string;
  title: string | null;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
  photoThumbUrl: string | null;
  photoUrl: string | null;
  archiveId: number | null;
  linkedGroup: string | null;
}

/**
 * ProjectId feloldás és személylista kezelés az overlay-hez.
 * Az 5× ismétlődő projectId resolve + persons fetch logikát egységesíti.
 */
@Injectable()
export class OverlayProjectService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggerService);

  /** Utolsó ismert projectId (fallback ha a context frissül közben) */
  private lastProjectId: number | null = null;

  /** Személylista signal */
  readonly persons = signal<PersonItem[]>([]);
  readonly loadingPersons = signal(false);
  readonly isLoggedOut = signal(false);

  /** Projekt meta adatok (email sablonhoz) */
  readonly projectMeta = signal<ProjectMeta | null>(null);

  /**
   * ProjectId feloldása — context → lastProjectId → Electron IPC fallback.
   * Ezt a 3 lépcsős logikát 5 helyen ismételte a komponens.
   */
  async resolveProjectId(context: OverlayContext): Promise<number | null> {
    let pid = context.projectId || this.lastProjectId;

    if (!pid && window.electronAPI) {
      try {
        const result = await window.electronAPI.overlay.getProjectId();
        if (result.projectId) {
          pid = result.projectId;
          this.lastProjectId = pid;
        }
      } catch { /* ignore */ }
    }

    if (pid) this.lastProjectId = pid;
    return pid;
  }

  /**
   * Személylista betöltése API-ból.
   * A result-ot a persons() signal-be tölti.
   */
  async fetchPersons(projectId: number): Promise<PersonItem[]> {
    try {
      const url = `${environment.apiUrl}/partner/projects/${projectId}/persons`;
      const res = await firstValueFrom(this.http.get<{ data: PersonItem[] }>(url));
      const list = res.data || [];
      this.ngZone.run(() => this.persons.set(list));
      return list;
    } catch (e) {
      this.logger.error('[PROJECT] fetch persons error:', e);
      return [];
    }
  }

  /**
   * Személylista betöltése observable-ként (subscribe-olja magát).
   * Loading state + auth error kezelés.
   */
  loadPersons(projectId: number): void {
    this.lastProjectId = projectId;
    this.loadingPersons.set(true);
    const url = `${environment.apiUrl}/partner/projects/${projectId}/persons`;

    this.http.get<{ data: PersonItem[] }>(url).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.persons.set(res.data || []);
          this.loadingPersons.set(false);
          this.isLoggedOut.set(false);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.loadingPersons.set(false);
          if (err.status === 401 || err.status === 419) {
            this.isLoggedOut.set(true);
          }
        });
      },
    });
  }

  /**
   * PersonId-ből lekéri a projectId-t a backend API-ból.
   */
  async lookupProjectIdFromPerson(personId: number): Promise<number | null> {
    try {
      const url = `${environment.apiUrl}/persons/${personId}/project-id`;
      const res = await firstValueFrom(this.http.get<{ projectId: number | null }>(url));
      if (res?.projectId) {
        this.lastProjectId = res.projectId;
        return res.projectId;
      }
    } catch { /* API nem elérhető */ }
    return null;
  }

  /**
   * Projekt meta adatok lekérése (iskola, osztály, kapcsolattartó, partner).
   */
  async fetchProjectMeta(projectId: number): Promise<ProjectMeta | null> {
    try {
      const url = `${environment.apiUrl}/partner/projects/${projectId}/meta`;
      const res = await firstValueFrom(this.http.get<{ data: ProjectMeta }>(url));
      const meta = res.data || null;
      this.ngZone.run(() => this.projectMeta.set(meta));
      return meta;
    } catch (e) {
      this.logger.error('[PROJECT] fetch meta error:', e);
      return null;
    }
  }

  /** Auth recovery: ha kijelentkezve, próbáljuk újra */
  tryAuthRecovery(context: OverlayContext): void {
    const pid = context.projectId;
    if (!pid) return;
    if (!this.loadingPersons()) {
      this.loadPersons(pid);
    }
  }

  getLastProjectId(): number | null {
    return this.lastProjectId;
  }

  setLastProjectId(pid: number): void {
    this.lastProjectId = pid;
  }
}
