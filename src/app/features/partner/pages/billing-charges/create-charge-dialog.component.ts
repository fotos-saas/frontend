import { Component, inject, OnInit, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { environment } from '../../../../../environments/environment';
import { PartnerBillingService } from '../../services/partner-billing.service';
import { PartnerServiceCatalogService } from '../../services/partner-service-catalog.service';
import { PartnerService } from '../../models/partner-service.models';

interface ProjectOption {
  id: number;
  name: string;
}

interface PersonOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-charge-dialog',
  standalone: true,
  imports: [DecimalPipe, FormsModule, LucideAngularModule],
  templateUrl: './create-charge-dialog.component.html',
  styleUrl: './create-charge-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChargeDialogComponent implements OnInit {
  readonly close = output<void>();
  readonly created = output<void>();

  private readonly http = inject(HttpClient);
  private readonly billingService = inject(PartnerBillingService);
  readonly catalogService = inject(PartnerServiceCatalogService);
  readonly ICONS = ICONS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly projects = signal<ProjectOption[]>([]);
  readonly persons = signal<PersonOption[]>([]);
  readonly saving = signal(false);

  selectedProjectId: number | null = null;
  selectedPersonId: number | null = null;
  selectedServiceId: number | null = null;
  serviceType = 'custom';
  description = '';
  amountHuf = 0;
  dueDate = '';
  notes = '';

  ngOnInit(): void {
    this.catalogService.loadServices();
    this.loadProjects();
  }

  onProjectChange(): void {
    if (this.selectedProjectId) {
      this.loadPersons(this.selectedProjectId);
    } else {
      this.persons.set([]);
    }
  }

  onServiceChange(): void {
    if (this.selectedServiceId) {
      const service = this.catalogService.services().find(
        (s: PartnerService) => s.id === this.selectedServiceId
      );
      if (service) {
        this.serviceType = service.service_type;
        this.amountHuf = service.default_price;
        if (!this.description) {
          this.description = service.name;
        }
      }
    }
  }

  save(): void {
    if (!this.selectedProjectId || !this.selectedPersonId || this.amountHuf <= 0) return;

    this.saving.set(true);

    const payload: Record<string, unknown> = {
      tablo_project_id: this.selectedProjectId,
      tablo_person_id: this.selectedPersonId,
      partner_service_id: this.selectedServiceId,
      service_type: this.serviceType,
      description: this.description || undefined,
      amount_huf: this.amountHuf,
      due_date: this.dueDate || undefined,
      notes: this.notes || undefined,
    };

    this.billingService.createCharge(payload, () => {
      this.saving.set(false);
      this.created.emit();
    }, () => {
      this.saving.set(false);
    });
  }

  private loadProjects(): void {
    this.http.get<{ data: { projects: ProjectOption[] } }>(
      `${environment.apiUrl}/partner/projects/autocomplete`
    ).subscribe({
      next: (res) => this.projects.set(res.data.projects),
    });
  }

  private loadPersons(projectId: number): void {
    this.http.get<{ data: { persons: PersonOption[] } }>(
      `${environment.apiUrl}/partner/projects/${projectId}/missing-persons`
    ).subscribe({
      next: (res) => this.persons.set(res.data.persons),
    });
  }
}
