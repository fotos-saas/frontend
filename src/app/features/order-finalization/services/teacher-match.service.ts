import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TeacherMatchResult } from '../models/order-finalization.models';

@Injectable({
  providedIn: 'root'
})
export class TeacherMatchService {
  private readonly http = inject(HttpClient);

  /**
   * Tanárnevek illesztése az archívummal.
   * Partner módban a partner API-t használja (projectId szükséges),
   * tablo frontend módban a tablo-frontend API-t.
   */
  matchTeacherNames(names: string[], projectId?: number): Observable<TeacherMatchResult[]> {
    const url = projectId
      ? `${environment.apiUrl}/partner/projects/${projectId}/match-teachers`
      : `${environment.apiUrl}/tablo-frontend/match-teachers`;

    return this.http.post<{ success: boolean; matches: TeacherMatchResult[] }>(
      url,
      { teacher_names: names }
    ).pipe(
      map(res => res.matches ?? [])
    );
  }
}
