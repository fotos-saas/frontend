import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EmailTemplateListItem,
  EmailTemplateDetail,
  EmailVariableGroup,
  EmailTemplatePreview,
} from '../models/email-template.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PartnerEmailTemplateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/partner/email-templates`;

  getTemplates(search?: string): Observable<ApiResponse<EmailTemplateListItem[]>> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<ApiResponse<EmailTemplateListItem[]>>(this.apiUrl, { params });
  }

  getTemplate(name: string): Observable<ApiResponse<EmailTemplateDetail>> {
    return this.http.get<ApiResponse<EmailTemplateDetail>>(`${this.apiUrl}/${name}`);
  }

  getVariables(): Observable<ApiResponse<EmailVariableGroup[]>> {
    return this.http.get<ApiResponse<EmailVariableGroup[]>>(`${this.apiUrl}/variables`);
  }

  updateTemplate(name: string, data: { subject: string; body: string }): Observable<ApiResponse<EmailTemplateDetail>> {
    return this.http.put<ApiResponse<EmailTemplateDetail>>(`${this.apiUrl}/${name}`, data);
  }

  resetToDefault(name: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${name}/reset`);
  }

  preview(name: string, data: { subject: string; body: string }): Observable<ApiResponse<EmailTemplatePreview>> {
    return this.http.post<ApiResponse<EmailTemplatePreview>>(`${this.apiUrl}/${name}/preview`, data);
  }
}
