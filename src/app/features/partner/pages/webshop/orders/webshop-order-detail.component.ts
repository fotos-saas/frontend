import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PsInputComponent } from '@shared/components/form';
import { PartnerWebshopService, ShopOrderDetail } from '../../../services/partner-webshop.service';
import { WEBSHOP_STATUS_LABELS, NEXT_STATUS, NEXT_STATUS_LABELS } from '../../../models/webshop.models';

@Component({
  selector: 'app-webshop-order-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent, PsInputComponent],
  templateUrl: './webshop-order-detail.component.html',
  styleUrl: './webshop-order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebshopOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private webshopService = inject(PartnerWebshopService);
  readonly ICONS = ICONS;
  readonly STATUS_LABELS = WEBSHOP_STATUS_LABELS;
  readonly NEXT_STATUS = NEXT_STATUS;
  readonly NEXT_STATUS_LABELS = NEXT_STATUS_LABELS;

  order = signal<ShopOrderDetail | null>(null);
  loading = signal(true);
  updating = signal(false);
  trackingNumber = signal('');
  showCancelConfirm = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder(id);
  }

  private loadOrder(id: number): void {
    this.loading.set(true);
    this.webshopService.getOrder(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    this.webshopService.updateOrderStatus(o.id, nextStatus, data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadOrder(o.id);
        this.updating.set(false);
      },
      error: () => this.updating.set(false),
    });
  }

  cancelOrder(): void {
    this.showCancelConfirm.set(true);
  }

  onCancelConfirmResult(result: ConfirmDialogResult): void {
    this.showCancelConfirm.set(false);
    if (result.action !== 'confirm') return;

    const o = this.order();
    if (!o) return;

    this.updating.set(true);
    this.webshopService.updateOrderStatus(o.id, 'cancelled').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
