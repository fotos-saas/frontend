import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { DraftResponse, DraftFilter } from '../../models/email-hub.models';

@Component({
  selector: 'app-email-hub-drafts',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './email-hub-drafts.component.html',
  styleUrl: './email-hub-drafts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHubDraftsComponent implements OnInit {
  private service = inject(EmailHubService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly drafts = signal<DraftResponse[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<DraftFilter>('pending');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  ngOnInit(): void {
    this.loadDrafts();
  }

  setFilter(f: DraftFilter): void {
    this.filter.set(f);
    this.currentPage.set(1);
    this.loadDrafts();
  }

  loadDrafts(): void {
    this.loading.set(true);
    this.service
      .getDrafts({ page: this.currentPage(), status: this.filter() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.drafts.set(data.items);
          this.totalPages.set(data.pagination.lastPage);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Draft-ok betöltési hiba', err);
          this.loading.set(false);
        },
      });
  }

  approve(draft: DraftResponse): void {
    this.service
      .approveDraft(draft.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Siker', 'Draft jóváhagyva és elküldve');
          this.loadDrafts();
        },
        error: (err) => {
          this.toast.error('Hiba', 'Nem sikerült a jóváhagyás');
          this.logger.error('Draft approve hiba', err);
        },
      });
  }

  reject(draft: DraftResponse): void {
    this.service
      .rejectDraft(draft.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.info('Kész', 'Draft elutasítva');
          this.loadDrafts();
        },
        error: (err) => {
          this.toast.error('Hiba', 'Nem sikerült az elutasítás');
          this.logger.error('Draft reject hiba', err);
        },
      });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadDrafts();
  }

  confidencePercent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  confidenceClass(value: number): string {
    if (value >= 0.85) return 'confidence--high';
    if (value >= 0.5) return 'confidence--medium';
    return 'confidence--low';
  }
}
