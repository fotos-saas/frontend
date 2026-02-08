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
  private readonly baseUrl = `${environment.apiUrl}/tablo-frontend`;

  matchTeacherNames(names: string[]): Observable<TeacherMatchResult[]> {
    return this.http.post<{ success: boolean; matches: TeacherMatchResult[] }>(
      `${this.baseUrl}/match-teachers`,
      { teacher_names: names }
    ).pipe(
      map(res => res.matches ?? [])
    );
  }
}
