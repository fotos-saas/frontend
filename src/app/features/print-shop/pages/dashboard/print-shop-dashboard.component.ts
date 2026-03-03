import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../../../environments/environment';

interface PrintShopStats {
  partner_name: string;
  stats: {
    pending_orders: number;
    active_projects: number;
    completed_this_month: number;
  };
}

@Component({
  selector: 'app-print-shop-dashboard',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './print-shop-dashboard.component.html',
  styleUrls: ['./print-shop-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopDashboardComponent {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  partnerName = signal<string>('Nyomda');
  loading = signal(true);
  stats = signal<PrintShopStats['stats']>({
    pending_orders: 0,
    active_projects: 0,
    completed_this_month: 0,
  });

  constructor() {
    this.loadStats();
  }

  private loadStats(): void {
    this.http.get<{ data: PrintShopStats }>(`${environment.apiUrl}/print-shop/stats`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.partnerName.set(response.data.partner_name);
          this.stats.set(response.data.stats);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }
}
