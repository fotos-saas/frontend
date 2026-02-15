import { Component, inject, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { PsInputComponent, PsSelectComponent, PsTextareaComponent, PsToggleComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PartnerServiceCatalogService } from '../../../services/partner-service-catalog.service';
import {
  PartnerService,
  PartnerServiceType,
  SERVICE_TYPE_OPTIONS,
} from '../../../models/partner-service.models';

@Component({
  selector: 'app-service-edit-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsSelectComponent, PsTextareaComponent, PsToggleComponent],
  templateUrl: './service-edit-dialog.component.html',
  styleUrl: './service-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceEditDialogComponent implements OnInit {
  readonly service = input<PartnerService | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly catalogService = inject(PartnerServiceCatalogService);
  readonly ICONS = ICONS;
  readonly SERVICE_TYPE_OPTIONS = SERVICE_TYPE_OPTIONS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly typeOptions: PsSelectOption[] = SERVICE_TYPE_OPTIONS.map(opt => ({
    id: opt.value,
    label: opt.label,
  }));

  name = '';
  description = '';
  serviceType: PartnerServiceType = 'custom';
  defaultPrice = 0;
  vatPercentage = 27;
  isActive = true;

  get isEdit(): boolean {
    return this.service() !== null;
  }

  ngOnInit(): void {
    const s = this.service();
    if (s) {
      this.name = s.name;
      this.description = s.description ?? '';
      this.serviceType = s.service_type;
      this.defaultPrice = s.default_price;
      this.vatPercentage = s.vat_percentage;
      this.isActive = s.is_active;
    }
  }

  save(): void {
    if (!this.name.trim()) return;

    const payload = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      service_type: this.serviceType,
      default_price: this.defaultPrice,
      vat_percentage: this.vatPercentage,
      is_active: this.isActive,
    };

    if (this.isEdit) {
      this.catalogService.updateService(this.service()!.id, payload);
    } else {
      this.catalogService.createService(payload);
    }

    this.saved.emit();
  }
}
