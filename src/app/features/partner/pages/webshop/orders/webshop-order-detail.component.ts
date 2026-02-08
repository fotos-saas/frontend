import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerWebshopService, ShopOrderDetail } from '../../../services/partner-webshop.service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Függőben',
  paid: 'Fizetve',
  processing: 'Feldolgozás',
  shipped: 'Szállítás alatt',
  completed: 'Kész',
  cancelled: 'Visszamondva',
};

const NEXT_STATUS: Record<string, string> = {
  paid: 'processing',
  processing: 'shipped',
  shipped: 'completed',
};

const NEXT_STATUS_LABELS: Record<string, string> = {
  paid: 'Feldolgozás megkezdése',
  processing: 'Szállításra adás',
  shipped: 'Lezárás',
};

@Component({
  selector: 'app-webshop-order-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './webshop-order-detail.component.html',
  styleUrl: './webshop-order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebshopOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private webshopService = inject(PartnerWebshopService);
  readonly ICONS = ICONS;
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly NEXT_STATUS = NEXT_STATUS;
  readonly NEXT_STATUS_LABELS = NEXT_STATUS_LABELS;

  order = signal<ShopOrderDetail | null>(null);
  loading = signal(true);
  updating = signal(false);
  trackingNumber = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder(id);
  }

  private loadOrder(id: number): void {
    this.loading.set(true);
    this.webshopService.getOrder(id).subscribe({
      next: (res) => {
        this.order.set(res.order);
        this.trackingNumber.set(res.order.tracking_number ?? '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  advanceStatus(): void {
    const o = this.order();
    if (!o) return;

    const nextStatus = NEXT_STATUS[o.status];
    if (!nextStatus) return;

    this.updating.set(true);
    const data: Record<string, string> = { status: nextStatus };
    if (nextStatus === 'shipped' && this.trackingNumber()) {
      data['tracking_number'] = this.trackingNumber();
    }

    this.webshopService.updateOrderStatus(o.id, nextStatus, data).subscribe({
      next: () => {
        this.loadOrder(o.id);
        this.updating.set(false);
      },
      error: () => this.updating.set(false),
    });
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;

    this.updating.set(true);
    this.webshopService.updateOrderStatus(o.id, 'cancelled').subscribe({
      next: () => {
        this.loadOrder(o.id);
        this.updating.set(false);
      },
      error: () => this.updating.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
