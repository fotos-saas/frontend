import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopConnection, PrintShopConnectionRequest } from '../../models/print-shop.models';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-print-shop-connections',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, ConfirmDialogComponent],
  templateUrl: './print-shop-connections.component.html',
  styleUrl: './print-shop-connections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopConnectionsComponent implements OnInit {
  private readonly service = inject(PrintShopService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  activeConnections = signal<PrintShopConnection[]>([]);
  incoming = signal<PrintShopConnectionRequest[]>([]);
  outgoing = signal<PrintShopConnectionRequest[]>([]);
  loading = signal(true);
  actionLoadingId = signal<number | null>(null);

  // Elutasítás / leválasztás megerősítés
  showRejectConfirm = signal(false);
  pendingRejectRequest = signal<PrintShopConnectionRequest | null>(null);

  showDisconnectConfirm = signal(false);
  pendingDisconnect = signal<PrintShopConnection | null>(null);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);

    // Aktív kapcsolatok betöltése
    this.service.getConnections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.activeConnections.set(data),
        error: () => {},
      });

    // Kérelmek betöltése
    this.service.getConnectionRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.incoming.set(data.incoming);
          this.outgoing.set(data.outgoing);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Hiba', 'Nem sikerült betölteni a kérelmeket.');
        },
      });
  }

  approve(request: PrintShopConnectionRequest): void {
    this.actionLoadingId.set(request.id);
    this.service.approveConnection(request.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Siker', res.message);
          this.actionLoadingId.set(null);
          this.loadRequests();
        },
        error: (err) => {
          this.toast.error('Hiba', err.error?.message ?? 'Nem sikerült elfogadni.');
          this.actionLoadingId.set(null);
        },
      });
  }

  confirmReject(request: PrintShopConnectionRequest): void {
    this.pendingRejectRequest.set(request);
    this.showRejectConfirm.set(true);
  }

  onRejectResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'confirm') {
      const req = this.pendingRejectRequest();
      if (req) {
        this.actionLoadingId.set(req.id);
        this.service.rejectConnection(req.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.toast.success('Siker', res.message);
              this.actionLoadingId.set(null);
              this.loadRequests();
            },
            error: (err) => {
              this.toast.error('Hiba', err.error?.message ?? 'Nem sikerült elutasítani.');
              this.actionLoadingId.set(null);
            },
          });
      }
    }
    this.showRejectConfirm.set(false);
    this.pendingRejectRequest.set(null);
  }

  withdraw(request: PrintShopConnectionRequest): void {
    this.actionLoadingId.set(request.id);
    this.service.removeConnection(request.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Siker', res.message);
          this.actionLoadingId.set(null);
          this.loadRequests();
        },
        error: (err) => {
          this.toast.error('Hiba', err.error?.message ?? 'Nem sikerült visszavonni.');
          this.actionLoadingId.set(null);
        },
      });
  }

  confirmDisconnect(connection: PrintShopConnection): void {
    this.pendingDisconnect.set(connection);
    this.showDisconnectConfirm.set(true);
  }

  onDisconnectResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'confirm') {
      const conn = this.pendingDisconnect();
      if (conn) {
        this.actionLoadingId.set(conn.id);
        this.service.removeConnection(conn.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.toast.success('Siker', res.message);
              this.actionLoadingId.set(null);
              this.loadRequests();
            },
            error: (err) => {
              this.toast.error('Hiba', err.error?.message ?? 'Nem sikerült leválasztani.');
              this.actionLoadingId.set(null);
            },
          });
      }
    }
    this.showDisconnectConfirm.set(false);
    this.pendingDisconnect.set(null);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('hu-HU', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}
