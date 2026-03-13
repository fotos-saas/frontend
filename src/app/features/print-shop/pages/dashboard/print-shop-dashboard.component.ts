import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopStats, PrintShopDashboardData, PrintShopDashboardProject } from '../../models/print-shop.models';
import { ToastService } from '../../../../core/services/toast.service';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-print-shop-dashboard',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, MatTooltipModule],
  templateUrl: './print-shop-dashboard.component.html',
  styleUrls: ['./print-shop-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopDashboardComponent {
  private service = inject(PrintShopService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  readonly ICONS = ICONS;

  partnerName = signal<string>('Nyomda');
  loading = signal(true);
  stats = signal<PrintShopStats['stats']>({
    in_print: 0,
    done_this_month: 0,
    connected_studios: 0,
    pending_requests: 0,
  });

  /** Összes nyomdában lévő projekt — legrégebbi elöl */
  allProjects = signal<PrintShopDashboardProject[]>([]);
  markingDone = signal<number | null>(null);

  hasProjects = computed(() => this.allProjects().length > 0);

  constructor() {
    this.loadData();
  }

  markProjectDone(project: PrintShopDashboardProject): void {
    if (this.markingDone()) return;
    this.markingDone.set(project.id);

    this.service.markAsDone(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allProjects.update(list => list.filter(p => p.id !== project.id));
          this.stats.update(s => ({
            ...s,
            in_print: Math.max(0, s.in_print - 1),
            done_this_month: s.done_this_month + 1,
          }));
          this.markingDone.set(null);
          this.toast.success('Kész', 'Projekt készre állítva');
        },
        error: () => {
          this.markingDone.set(null);
          this.toast.error('Hiba', 'Nem sikerült készre állítani');
        },
      });
  }

  downloadFile(project: PrintShopDashboardProject): void {
    const type = project.printFileType === 'print_flat' ? 'flat' : 'small_tablo';
    this.service.downloadFile(project.id, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ blob, fileName }) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.toast.error('Hiba', 'Letöltés sikertelen'),
      });
  }

  formatDays(days: number): string {
    if (days === 0) return 'ma';
    if (days === 1) return '1 napja';
    return `${days} napja`;
  }

  formatArrivalTooltip(project: PrintShopDashboardProject): string {
    if (!project.inPrintAt) return 'Beérkezett';
    const d = new Date(project.inPrintAt);
    return `Beérkezett: ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
  }

  private loadData(): void {
    forkJoin({
      stats: this.service.getStats(),
      dashboard: this.service.getDashboardData(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ stats, dashboard }) => {
          this.partnerName.set(stats.partner_name);
          this.stats.set(stats.stats);
          // Egyetlen lista: overdue (legrégebbi) elöl, utána recent
          const merged = [...dashboard.overdue_projects, ...dashboard.recent_projects];
          this.allProjects.set(merged);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Hiba', 'Nem sikerült betölteni az adatokat');
        },
      });
  }
}
