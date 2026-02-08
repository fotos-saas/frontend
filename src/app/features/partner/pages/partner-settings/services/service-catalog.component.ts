import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerServiceCatalogService } from '../../../services/partner-service-catalog.service';
import { PartnerService, SERVICE_TYPE_LABELS } from '../../../models/partner-service.models';
import { ServiceEditDialogComponent } from './service-edit-dialog.component';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, ServiceEditDialogComponent],
  templateUrl: './service-catalog.component.html',
  styleUrl: './service-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCatalogComponent implements OnInit {
  readonly catalogService = inject(PartnerServiceCatalogService);
  readonly ICONS = ICONS;
  readonly SERVICE_TYPE_LABELS = SERVICE_TYPE_LABELS;

  readonly showEditDialog = signal(false);
  readonly editingService = signal<PartnerService | null>(null);

  ngOnInit(): void {
    this.catalogService.loadServices();
  }

  openCreate(): void {
    this.editingService.set(null);
    this.showEditDialog.set(true);
  }

  openEdit(service: PartnerService): void {
    this.editingService.set(service);
    this.showEditDialog.set(true);
  }

  closeDialog(): void {
    this.showEditDialog.set(false);
    this.editingService.set(null);
  }

  deleteService(service: PartnerService): void {
    this.catalogService.deleteService(service.id);
  }

  seedDefaults(): void {
    this.catalogService.seedDefaults();
  }
}
