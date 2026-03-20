import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import { createResourceLoader } from '@shared/utils/resource-loader.util';
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
  private rl = createResourceLoader();

  readonly ICONS = ICONS;
  readonly rounds = signal<ModificationRound[]>([]);
  readonly loading = this.rl.loading;
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  ngOnInit(): void {
    this.loadRounds();
  }

  loadRounds(): void {
    this.rl.load(
      this.service.getModificationRounds({ page: this.currentPage() }),
      (data) => { this.rounds.set(data.items); this.totalPages.set(data.pagination.lastPage); },
      'Módosítási körök betöltési hiba',
    );
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
