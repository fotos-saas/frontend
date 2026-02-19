import { Component, inject, OnInit, signal, output, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent, PsSelectComponent, PsTextareaComponent, PsDatepickerComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PartnerBillingService } from '../../services/partner-billing.service';
import { PartnerServiceCatalogService } from '../../services/partner-service-catalog.service';
import { PartnerProjectService } from '../../services/partner-project.service';
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
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsSelectComponent, PsTextareaComponent, PsDatepickerComponent, DialogWrapperComponent],
  templateUrl: './create-charge-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChargeDialogComponent implements OnInit {
  readonly close = output<void>();
  readonly created = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly billingService = inject(PartnerBillingService);
  private readonly projectService = inject(PartnerProjectService);
  readonly catalogService = inject(PartnerServiceCatalogService);
  readonly ICONS = ICONS;

  readonly projects = signal<ProjectOption[]>([]);
  readonly persons = signal<PersonOption[]>([]);
  readonly saving = signal(false);

  readonly projectOptions = computed<PsSelectOption[]>(() =>
    this.projects().map(p => ({ id: p.id, label: p.name }))
  );

  readonly personOptions = computed<PsSelectOption[]>(() =>
    this.persons().map(p => ({ id: p.id, label: p.name }))
  );

  readonly serviceOptions = computed<PsSelectOption[]>(() =>
    this.catalogService.services().map((s: PartnerService) => ({
      id: s.id,
      label: `${s.name} — ${s.default_price.toLocaleString('hu-HU')} Ft`,
    }))
  );

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
    this.projectService.getProjectsAutocomplete().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (projects) => this.projects.set(projects as ProjectOption[]),
    });
  }

  private loadPersons(projectId: number): void {
    this.projectService.getProjectPersons(projectId, true).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => this.persons.set(res.data as PersonOption[]),
    });
  }
}
