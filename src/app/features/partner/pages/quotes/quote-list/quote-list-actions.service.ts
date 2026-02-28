import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PartnerQuoteService } from '../../../services/partner-quote.service';
import { Quote, QuoteTemplate } from '../../../models/quote.models';
import { ToastService } from '@core/services/toast.service';
import { saveFile } from '@shared/utils/file.util';

@Injectable()
export class QuoteListActionsService {
  private readonly quoteService = inject(PartnerQuoteService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly quotes = signal<Quote[]>([]);
  readonly loading = signal(false);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly templates = signal<QuoteTemplate[]>([]);

  loadQuotes(): void {
    this.loading.set(true);
    this.quoteService.getQuotes({
      search: this.search() || undefined,
      status: this.statusFilter() || undefined,
      page: this.currentPage(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.quotes.set(res.data.items);
        this.currentPage.set(res.data.pagination.current_page);
        this.lastPage.set(res.data.pagination.last_page);
        this.total.set(res.data.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült az árajánlatok betöltése');
        this.loading.set(false);
      },
    });
  }

  loadTemplates(): void {
    this.quoteService.getTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.templates.set(res.data),
      });
  }

  duplicate(quote: Quote): void {
    this.quoteService.duplicateQuote(quote.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Siker', 'Árajánlat duplikálva');
          this.router.navigate(['/partner/quotes', res.data.id]);
        },
        error: () => this.toast.error('Hiba', 'Duplikálás sikertelen'),
      });
  }

  deleteQuote(quote: Quote): void {
    this.quoteService.deleteQuote(quote.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Siker', 'Árajánlat törölve');
          this.loadQuotes();
        },
        error: () => this.toast.error('Hiba', 'Törlés sikertelen'),
      });
  }

  downloadPdf(quote: Quote): void {
    this.quoteService.downloadPdf(quote.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => saveFile(blob, `arajanlat-${quote.quote_number}.pdf`),
        error: () => this.toast.error('Hiba', 'PDF letöltés sikertelen'),
      });
  }

  createFromTemplate(templateId: number): void {
    this.quoteService.createFromTemplate(templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Siker', 'Árajánlat létrehozva sablonból');
          this.router.navigate(['/partner/quotes', res.data.id]);
        },
        error: () => this.toast.error('Hiba', 'Létrehozás sikertelen'),
      });
  }

  updateStatus(quote: Quote, status: string): void {
    this.quoteService.updateStatus(quote.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Siker', 'Státusz frissítve');
          this.loadQuotes();
        },
        error: () => this.toast.error('Hiba', 'Státusz frissítés sikertelen'),
      });
  }
}
