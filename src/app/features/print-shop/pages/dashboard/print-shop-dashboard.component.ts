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

  recentProjects = signal<PrintShopDashboardProject[]>([]);
  overdueProjects = signal<PrintShopDashboardProject[]>([]);
  markingDone = signal<number | null>(null);

  hasRecentProjects = computed(() => this.recentProjects().length > 0);
  hasOverdueProjects = computed(() => this.overdueProjects().length > 0);
  hasAnyProjects = computed(() => this.hasRecentProjects() || this.hasOverdueProjects());

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
          this.recentProjects.update(list => list.filter(p => p.id !== project.id));
          this.overdueProjects.update(list => list.filter(p => p.id !== project.id));
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

  formatDaysWaiting(days: number): string {
    if (days === 0) return 'Ma érkezett';
    if (days === 1) return 'Tegnap';
    return `${days} napja`;
  }

  formatArrivalTooltip(project: PrintShopDashboardProject): string {
    if (!project.inPrintAt) return 'Beérkezett';
    const d = new Date(project.inPrintAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `Beérkezett: ${year}.${month}.${day}.`;
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
          this.recentProjects.set(dashboard.recent_projects);
          this.overdueProjects.set(dashboard.overdue_projects);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Hiba', 'Nem sikerült betölteni az adatokat');
        },
      });
  }
}
