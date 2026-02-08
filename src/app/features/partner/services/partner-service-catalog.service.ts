import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.models';
import {
  PartnerService,
  CreatePartnerServicePayload,
  UpdatePartnerServicePayload,
} from '../models/partner-service.models';

@Injectable({
  providedIn: 'root',
})
export class PartnerServiceCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/services`;

  readonly services = signal<PartnerService[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<ApiResponse<{ services: PartnerService[] }>>(this.baseUrl).subscribe({
      next: (res) => {
        this.services.set(res.data.services);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nem sikerült betölteni a szolgáltatásokat.');
        this.loading.set(false);
      },
    });
  }

  createService(payload: CreatePartnerServicePayload): void {
    this.http.post<ApiResponse<{ service: PartnerService }>>(this.baseUrl, payload).subscribe({
      next: (res) => {
        this.services.update(list => [...list, res.data.service]);
      },
      error: () => {
        this.error.set('Nem sikerült létrehozni a szolgáltatást.');
      },
    });
  }

  updateService(id: number, payload: UpdatePartnerServicePayload): void {
    this.http.put<ApiResponse<{ service: PartnerService }>>(`${this.baseUrl}/${id}`, payload).subscribe({
      next: (res) => {
        this.services.update(list => list.map(s => s.id === id ? res.data.service : s));
      },
      error: () => {
        this.error.set('Nem sikerült frissíteni a szolgáltatást.');
      },
    });
  }

  deleteService(id: number): void {
    this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`).subscribe({
      next: () => {
        this.services.update(list => list.filter(s => s.id !== id));
      },
      error: () => {
        this.error.set('Nem sikerült törölni a szolgáltatást.');
      },
    });
  }

  seedDefaults(): void {
    this.loading.set(true);
    this.http.post<ApiResponse<{ services: PartnerService[] }>>(`${this.baseUrl}/seed-defaults`, {}).subscribe({
      next: (res) => {
        this.services.set(res.data.services);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nem sikerült betölteni az alapértelmezetteket.');
        this.loading.set(false);
      },
    });
  }
}
