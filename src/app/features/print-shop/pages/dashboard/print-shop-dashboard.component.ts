import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopStats } from '../../models/print-shop.models';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-print-shop-dashboard',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './print-shop-dashboard.component.html',
  styleUrls: ['./print-shop-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopDashboardComponent {
  private service = inject(PrintShopService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  partnerName = signal<string>('Nyomda');
  loading = signal(true);
  stats = signal<PrintShopStats['stats']>({
    in_print: 0,
    done_this_month: 0,
    connected_studios: 0,
    pending_requests: 0,
  });

  constructor() {
    this.loadStats();
  }

  private loadStats(): void {
    this.service.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.partnerName.set(data.partner_name);
          this.stats.set(data.stats);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }
}
