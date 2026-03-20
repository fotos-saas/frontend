import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { ModificationRound } from '../../models/email-hub.models';

@Component({
  selector: 'app-email-hub-modifications',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './email-hub-modifications.component.html',
  styleUrl: './email-hub-modifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHubModificationsComponent implements OnInit {
  private service = inject(EmailHubService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  readonly ICONS = ICONS;
  readonly rounds = signal<ModificationRound[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  ngOnInit(): void {
    this.loadRounds();
  }

  loadRounds(): void {
    this.loading.set(true);
    this.service.getModificationRounds({ page: this.currentPage() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.rounds.set(data.items);
          this.totalPages.set(data.pagination.lastPage);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Módosítási körök betöltési hiba', err);
          this.loading.set(false);
        },
      });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadRounds();
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  formatPrice(huf: number | null): string {
    if (!huf) return 'Ingyenes';
    return `${huf.toLocaleString('hu-HU')} Ft`;
  }

  statusColor(color: string): string {
    const map: Record<string, string> = {
      amber: '#f59e0b',
      blue: '#3b82f6',
      green: '#22c55e',
      gray: '#94a3b8',
    };
    return map[color] ?? '#94a3b8';
  }
}
