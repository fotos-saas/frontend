import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { TableHeaderComponent, TableColumn } from '../../../../../shared/components/table-header';
import { PartnerServiceCatalogService } from '../../../services/partner-service-catalog.service';
import { PartnerService, SERVICE_TYPE_LABELS } from '../../../models/partner-service.models';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ServiceEditDialogComponent } from './service-edit-dialog.component';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent, ServiceEditDialogComponent, TableHeaderComponent],
  templateUrl: './service-catalog.component.html',
  styleUrl: './service-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCatalogComponent implements OnInit {
  readonly catalogService = inject(PartnerServiceCatalogService);
  readonly ICONS = ICONS;
  readonly SERVICE_TYPE_LABELS = SERVICE_TYPE_LABELS;

  readonly tableCols: TableColumn[] = [
    { key: 'name', label: 'Név' },
    { key: 'type', label: 'Típus', width: '120px', align: 'center' },
    { key: 'price', label: 'Alapár', width: '120px', align: 'right' },
    { key: 'status', label: 'Állapot', width: '110px', align: 'center' },
    { key: 'actions', label: 'Műveletek', width: '120px', align: 'center' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly showEditDialog = signal(false);
  readonly editingService = signal<PartnerService | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly deleteTarget = signal<PartnerService | null>(null);

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
    this.deleteTarget.set(service);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm' && this.deleteTarget()) {
      this.catalogService.deleteService(this.deleteTarget()!.id);
    }
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  seedDefaults(): void {
    this.catalogService.seedDefaults();
  }
}
