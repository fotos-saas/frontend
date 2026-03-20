import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { ICONS } from '@shared/constants/icons.constants';
import { environment } from '../../../../../environments/environment';
import { createResourceLoader } from '@shared/utils/resource-loader.util';
import type { ApiResponse } from '../../../../core/models/api.models';

interface SeasonReport {
  overview: {
    total_projects: number;
    total_hours: number;
    total_included_hours: number;
    total_overage_hours: number;
    total_overage_revenue: number;
    avg_utilization_pct: number;
  };
  work_type_stats: WorkTypeStat[];
  ai_accuracy: {
    total_compared: number;
    overall_accuracy: number;
    by_work_type: Record<string, { count: number; avg_accuracy_pct: number; avg_estimated: number; avg_actual: number; bias: number }>;
  };
  revenue: {
    total_overage_revenue_ft: number;
    projects_with_overage: number;
    projects_within_budget: number;
    avg_overage_per_project: number;
    max_overage: number;
  };
}

interface WorkTypeStat {
  work_type: string;
  entry_count: number;
  avg_minutes: number;
  min_minutes: number;
  max_minutes: number;
  std_dev: number;
}

@Component({
  selector: 'app-email-hub-analytics',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe, KeyValuePipe],
  templateUrl: './email-hub-analytics.component.html',
  styleUrl: './email-hub-analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHubAnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  private rl = createResourceLoader();

  readonly ICONS = ICONS;
  readonly loading = this.rl.loading;
  readonly report = signal<SeasonReport | null>(null);

  ngOnInit(): void {
    this.loadReport();
  }

  private loadReport(): void {
    this.rl.load(
      this.http
        .get<ApiResponse<SeasonReport>>(`${environment.apiUrl}/partner/analytics/season`)
        .pipe(map((res) => res.data)),
      (data) => this.report.set(data),
      'Analitika betöltési hiba',
    );
  }

  maxBarValue(): number {
    const stats = this.report()?.work_type_stats;
    if (!stats?.length) return 1;
    return Math.max(...stats.map((s) => s.avg_minutes), 1);
  }

  barWidth(value: number): string {
    return `${Math.max((value / this.maxBarValue()) * 100, 5)}%`;
  }

  workTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      face_swap: 'Arccsere',
      retouch: 'Retusálás',
      background_change: 'Háttércsere',
      text_correction: 'Szövegjavítás',
      layout_change: 'Elrendezés',
      color_adjustment: 'Szín korrekció',
      photo_replacement: 'Fotócsere',
      other: 'Egyéb',
    };
    return labels[type] ?? type;
  }

  biasLabel(bias: number): string {
    if (bias > 2) return `+${bias}p túlbecslés`;
    if (bias < -2) return `${bias}p alulbecslés`;
    return 'pontos';
  }
}
