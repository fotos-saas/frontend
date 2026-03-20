import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { createResourceLoader } from '@shared/utils/resource-loader.util';
import type { AiCostSummary, AiDailyCost } from '../../models/email-hub.models';

@Component({
  selector: 'app-email-hub-ai-costs',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './email-hub-ai-costs.component.html',
  styleUrl: './email-hub-ai-costs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHubAiCostsComponent implements OnInit {
  private service = inject(EmailHubService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private rl = createResourceLoader(this.destroyRef);

  readonly ICONS = ICONS;
  readonly loading = this.rl.loading;
  readonly summary = signal<AiCostSummary | null>(null);
  readonly dailyCosts = signal<AiDailyCost[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.rl.load(
      this.service.getAiCosts(),
      (data) => this.summary.set(data),
      'AI költségek betöltési hiba',
    );

    this.service.getAiCostsDaily()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.dailyCosts.set(data),
        error: (err) => this.logger.error('Napi költségek hiba', err),
      });
  }

  formatUsd(value: number): string {
    return `$${value.toFixed(4)}`;
  }

  formatTokens(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  }

  maxDailyCost(): number {
    const costs = this.dailyCosts();
    if (costs.length === 0) return 1;
    return Math.max(...costs.map(d => d.costUsd), 0.001);
  }

  barHeight(cost: number): string {
    return `${Math.max((cost / this.maxDailyCost()) * 100, 2)}%`;
  }
}
