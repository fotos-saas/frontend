import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PartnerQuoteService } from '../../../services/partner-quote.service';
import { Quote, QuoteEmail } from '../../../models/quote.models';
import { ToastService } from '@core/services/toast.service';
import { saveFile } from '@shared/utils/file.util';

@Injectable()
export class QuoteEditorActionsService {
  private readonly quoteService = inject(PartnerQuoteService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly emailHistory = signal<QuoteEmail[]>([]);
  readonly isNew = signal(true);

  readonly pageTitle = computed(() =>
    this.isNew() ? 'Új árajánlat' : `Árajánlat: ${this.quote()?.quote_number ?? ''}`
  );

  loadQuote(id: number): void {
    this.isNew.set(false);
    this.loading.set(true);
    this.quoteService.getQuote(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.quote.set(res.data);
          this.emailHistory.set(res.data.emails ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Hiba', 'Árajánlat betöltése sikertelen');
          this.loading.set(false);
          this.router.navigate(['/partner/quotes']);
        },
      });
  }

  save(data: Partial<Quote>): void {
    this.saving.set(true);
    const quote = this.quote();

    const obs = quote
      ? this.quoteService.updateQuote(quote.id, data)
      : this.quoteService.createQuote(data);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.quote.set(res.data);
        this.saving.set(false);
        this.toast.success('Siker', quote ? 'Árajánlat mentve' : 'Árajánlat létrehozva');
        if (!quote) {
          this.isNew.set(false);
          this.router.navigate(['/partner/quotes', res.data.id], { replaceUrl: true });
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Mentés sikertelen');
      },
    });
  }

  saveAsTemplate(data: Partial<Quote>, templateName: string): void {
    this.saving.set(true);
    const payload = { ...data, status: 'template' as const, template_name: templateName };
    this.quoteService.createQuote(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Siker', 'Sablon mentve');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Hiba', 'Sablon mentés sikertelen');
        },
      });
  }

  downloadPdf(): void {
    const quote = this.quote();
    if (!quote) return;
    this.quoteService.downloadPdf(quote.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => saveFile(blob, `arajanlat-${quote.quote_number}.pdf`),
        error: () => this.toast.error('Hiba', 'PDF letöltés sikertelen'),
      });
  }

  sendEmail(data: { to_email: string; subject: string; body: string }): void {
    const quote = this.quote();
    if (!quote) return;
    this.quoteService.sendEmail(quote.id, data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Siker', 'Email elküldve');
          this.emailHistory.update(prev => [res.data, ...prev]);
          this.loadQuote(quote.id);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Email küldés sikertelen';
          this.toast.error('Hiba', msg);
        },
      });
  }

  updateStatus(status: string): void {
    const quote = this.quote();
    if (!quote) return;
    this.quoteService.updateStatus(quote.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Siker', 'Státusz frissítve');
          this.loadQuote(quote.id);
        },
        error: () => this.toast.error('Hiba', 'Státusz frissítés sikertelen'),
      });
  }
}
