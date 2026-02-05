import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerOrdersService, PartnerClient } from '../../../services/partner-orders.service';
import { ClientEditModalComponent } from '../../../components/client-edit-modal/client-edit-modal.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { useFilterState } from '../../../../../shared/utils/use-filter-state';
import { getInitials } from '../../../../../shared/utils/formatters.util';

/**
 * Partner Client List - Ügyfelek listája a partner felületen.
 * Paginált táblázatos nézet, CRUD műveletekkel.
 */
@Component({
  selector: 'app-partner-client-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ClientEditModalComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerClientListComponent implements OnInit {
  private readonly ordersService = inject(PartnerOrdersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'clients' },
    defaultFilters: {},
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadClients(),
  });

  clients = signal<PartnerClient[]>([]);
  totalPages = signal(1);
  totalClients = signal(0);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedClient = signal<PartnerClient | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.filterState.loading.set(true);

    this.ordersService.getClients({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.clients.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalClients.set(response.total);
          this.filterState.loading.set(false);
        },
        error: () => {
          this.filterState.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  viewClient(client: PartnerClient): void {
    this.router.navigate(['/partner/orders/clients', client.id]);
  }

  openCreateModal(): void {
    this.selectedClient.set(null);
    this.modalMode.set('create');
    this.showEditModal.set(true);
  }

  editClient(client: PartnerClient): void {
    this.selectedClient.set(client);
    this.modalMode.set('edit');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedClient.set(null);
  }

  onClientSaved(client: PartnerClient): void {
    this.closeEditModal();
    this.loadClients();
  }

  confirmDeleteClient(client: PartnerClient): void {
    if (client.albumsCount > 0) return;
    this.selectedClient.set(client);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedClient.set(null);
  }

  deleteClient(): void {
    const client = this.selectedClient();
    if (!client) return;

    this.ordersService.deleteClient(client.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDeleteConfirm();
          this.loadClients();
        },
        error: () => {
          this.closeDeleteConfirm();
        }
      });
  }

  getInitials(name: string): string {
    return getInitials(name);
  }
}
