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

interface EmailTemplateResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PartnerEmailTemplateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/partner/email-templates`;

  getTemplates(search?: string): Observable<EmailTemplateResponse<EmailTemplateListItem[]>> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<EmailTemplateResponse<EmailTemplateListItem[]>>(this.apiUrl, { params });
  }

  getTemplate(name: string): Observable<EmailTemplateResponse<EmailTemplateDetail>> {
    return this.http.get<EmailTemplateResponse<EmailTemplateDetail>>(`${this.apiUrl}/${name}`);
  }

  getVariables(): Observable<EmailTemplateResponse<EmailVariableGroup[]>> {
    return this.http.get<EmailTemplateResponse<EmailVariableGroup[]>>(`${this.apiUrl}/variables`);
  }

  updateTemplate(name: string, data: { subject: string; body: string }): Observable<EmailTemplateResponse<EmailTemplateDetail>> {
    return this.http.put<EmailTemplateResponse<EmailTemplateDetail>>(`${this.apiUrl}/${name}`, data);
  }

  resetToDefault(name: string): Observable<EmailTemplateResponse<null>> {
    return this.http.delete<EmailTemplateResponse<null>>(`${this.apiUrl}/${name}/reset`);
  }

  preview(name: string, data: { subject: string; body: string }): Observable<EmailTemplateResponse<EmailTemplatePreview>> {
    return this.http.post<EmailTemplateResponse<EmailTemplatePreview>>(`${this.apiUrl}/${name}/preview`, data);
  }
}
