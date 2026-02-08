import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerWebshopService, ShopOrder, OrderStats } from '../../../services/partner-webshop.service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Függőben',
  paid: 'Fizetve',
  processing: 'Feldolgozás',
  shipped: 'Szállítás alatt',
  completed: 'Kész',
  cancelled: 'Visszamondva',
};

@Component({
  selector: 'app-webshop-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './webshop-orders.component.html',
  styleUrl: './webshop-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebshopOrdersComponent implements OnInit {
  private webshopService = inject(PartnerWebshopService);
  private router = inject(Router);
  readonly ICONS = ICONS;
  readonly STATUS_LABELS = STATUS_LABELS;

  orders = signal<ShopOrder[]>([]);
  stats = signal<OrderStats | null>(null);
  loading = signal(true);
  statusFilter = signal('');
  searchQuery = signal('');
  totalOrders = signal(0);

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
  }

  loadOrders(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.searchQuery()) params['search'] = this.searchQuery();

    this.webshopService.getOrders(params).subscribe({
      next: (res) => {
        this.orders.set(res.orders);
        this.totalOrders.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadStats(): void {
    this.webshopService.getOrderStats().subscribe({
      next: (res) => this.stats.set(res.stats),
    });
  }

  openDetail(order: ShopOrder): void {
    this.router.navigate([this.router.url.replace('/orders', `/orders/${order.id}`)]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-info';
      case 'processing': return 'badge-warning';
      case 'shipped': return 'badge-primary';
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-muted';
    }
  }

  onSearch(): void {
    this.loadOrders();
  }

  onFilterChange(): void {
    this.loadOrders();
  }
}
