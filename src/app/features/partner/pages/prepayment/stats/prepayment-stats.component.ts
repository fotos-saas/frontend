import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import {
  PrepaymentStats,
  PREPAYMENT_MODE_LABELS,
} from '../../../models/prepayment.models';
import { PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PartnerProjectService } from '../../../services/partner-project.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-prepayment-stats',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    LucideAngularModule,
    PsSelectComponent,
  ],
  templateUrl: './prepayment-stats.component.html',
  styleUrl: './prepayment-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentStatsComponent implements OnInit {
  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly MODE_LABELS = PREPAYMENT_MODE_LABELS;

  stats = signal<PrepaymentStats | null>(null);
  loading = signal(true);

  // Szűrők
  projects = signal<PsSelectOption[]>([]);
  selectedProjectId = signal<string>('');
  dateFrom = signal('');
  dateTo = signal('');

  // Összegző kártyák
  readonly statCards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Beszedve', value: s.total_collected, icon: ICONS.CHECK_CIRCLE, color: 'green' },
      { label: 'Felhasználva', value: s.total_used, icon: ICONS.SHOPPING_BAG, color: 'blue' },
      { label: 'Függőben', value: s.total_pending, icon: ICONS.CLOCK, color: 'amber' },
      { label: 'Elveszett', value: s.total_forfeited, icon: ICONS.ALERT_TRIANGLE, color: 'red' },
      { label: 'Visszatérítve', value: s.total_refunded, icon: ICONS.UNDO, color: 'orange' },
    ];
  });

  // Konverziós ráta
  readonly conversionPercent = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Math.round(s.conversion_rate * 100);
  });

  // Mód szerinti bontás
  readonly modeBreakdown = computed(() => {
    const s = this.stats();
    if (!s || !s.by_mode) return [];
    return Object.entries(s.by_mode).map(([mode, data]) => ({
      mode,
      label: this.MODE_LABELS[mode as keyof typeof this.MODE_LABELS] ?? mode,
      count: data.count,
      total: data.total,
    }));
  });

  ngOnInit(): void {
    this.loadProjects();
    this.loadStats();
  }

  private loadProjects(): void {
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const list = res.data ?? res;
          this.projects.set([
            { id: '', label: 'Összes projekt' },
            ...list.map((p: any) => ({ id: p.id.toString(), label: p.name })),
          ]);
        },
      });
  }

  loadStats(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.selectedProjectId()) params['project_id'] = this.selectedProjectId();
    if (this.dateFrom()) params['date_from'] = this.dateFrom();
    if (this.dateTo()) params['date_to'] = this.dateTo();

    this.prepaymentService.getStats(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.stats.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onFilterChange(): void {
    this.loadStats();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getBarWidth(value: number): string {
    const s = this.stats();
    if (!s || s.total_collected === 0) return '0%';
    return Math.min(100, Math.round((value / s.total_collected) * 100)) + '%';
  }
}
