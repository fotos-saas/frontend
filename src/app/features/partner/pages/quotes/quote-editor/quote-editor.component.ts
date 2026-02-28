import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '@shared/constants';
import { QuoteEditorActionsService } from './quote-editor-actions.service';
import { PartnerQuoteService } from '../../../services/partner-quote.service';
import { Quote, QUOTE_STATUS_CONFIG, ContentItem, PriceListItem, VolumeDiscount } from '../../../models/quote.models';
import { SendQuoteEmailDialogComponent } from '../components/send-quote-email-dialog/send-quote-email-dialog.component';
import { QuoteEmailHistoryComponent } from '../components/quote-email-history/quote-email-history.component';

type EditorTab = 'data' | 'content' | 'pricing' | 'preview';

@Component({
  selector: 'app-quote-editor',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    NgClass,
    SendQuoteEmailDialogComponent,
    QuoteEmailHistoryComponent,
  ],
  providers: [QuoteEditorActionsService],
  templateUrl: './quote-editor.component.html',
  styleUrl: './quote-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteEditorComponent implements OnInit, OnDestroy {
  protected readonly actions = inject(QuoteEditorActionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly quoteService = inject(PartnerQuoteService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;
  protected readonly STATUS_CONFIG = QUOTE_STATUS_CONFIG;

  protected showEmailDialog = signal(false);
  protected activeTab = signal<EditorTab>('data');
  protected pdfPreviewUrl = signal<SafeResourceUrl>(
    this.sanitizer.bypassSecurityTrustResourceUrl('about:blank')
  );
  protected pdfLoading = signal(false);
  private currentBlobUrl: string | null = null;

  private readonly tabEffect = effect(() => {
    if (this.activeTab() === 'preview' && this.actions.quote()) {
      this.loadPdfPreview();
    }
  });

  // Form model
  protected form = signal<Partial<Quote>>({
    customer_name: '',
    customer_title: '',
    customer_email: '',
    customer_phone: '',
    quote_category: 'custom',
    quote_type: 'repro',
    size: '',
    intro_text: '',
    content_items: [],
    price_list_items: [],
    volume_discounts: [],
    is_full_execution: false,
    has_small_tablo: false,
    has_shipping: false,
    has_production: false,
    base_price: 0,
    discount_price: 0,
    small_tablo_price: 0,
    shipping_price: 0,
    production_price: 0,
    small_tablo_text: '',
    production_text: '',
    discount_text: '',
    notes: '',
    valid_until: null,
  });

  protected totalPrice = computed(() => {
    const f = this.form();
    let total = (f.discount_price || 0) > 0 ? (f.discount_price || 0) : (f.base_price || 0);
    if (f.has_small_tablo) total += f.small_tablo_price || 0;
    if (f.has_shipping) total += f.shipping_price || 0;
    if (f.has_production) total += f.production_price || 0;
    return total;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.actions.loadQuote(+id);
      const checkInterval = setInterval(() => {
        const q = this.actions.quote();
        if (q) {
          this.populateForm(q);
          clearInterval(checkInterval);
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  }

  private populateForm(q: Quote): void {
    this.form.set({
      customer_name: q.customer_name || '',
      customer_title: q.customer_title || '',
      customer_email: q.customer_email || '',
      customer_phone: q.customer_phone || '',
      quote_category: q.quote_category || 'custom',
      quote_type: q.quote_type || 'repro',
      size: q.size || '',
      intro_text: q.intro_text || '',
      content_items: q.content_items ? [...q.content_items] : [],
      price_list_items: q.price_list_items ? [...q.price_list_items] : [],
      volume_discounts: q.volume_discounts ? [...q.volume_discounts] : [],
      is_full_execution: q.is_full_execution,
      has_small_tablo: q.has_small_tablo,
      has_shipping: q.has_shipping,
      has_production: q.has_production,
      base_price: q.base_price || 0,
      discount_price: q.discount_price || 0,
      small_tablo_price: q.small_tablo_price || 0,
      shipping_price: q.shipping_price || 0,
      production_price: q.production_price || 0,
      small_tablo_text: q.small_tablo_text || '',
      production_text: q.production_text || '',
      discount_text: q.discount_text || '',
      notes: q.notes || '',
      valid_until: q.valid_until,
    });
  }

  updateField(field: string, value: unknown): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  save(): void {
    this.actions.save(this.form());
  }

  refreshPdfPreview(): void {
    this.loadPdfPreview();
  }

  private loadPdfPreview(): void {
    const quote = this.actions.quote();
    if (!quote) return;
    this.pdfLoading.set(true);
    this.revokeBlobUrl();
    this.quoteService.downloadPdf(quote.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.currentBlobUrl = URL.createObjectURL(blob);
          this.pdfPreviewUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl)
          );
          this.pdfLoading.set(false);
        },
        error: () => this.pdfLoading.set(false),
      });
  }

  private revokeBlobUrl(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  // --- Tartalom szekció ---

  addContentItem(): void {
    this.form.update(f => ({
      ...f,
      content_items: [...(f.content_items || []), { title: '', description: '' }],
    }));
  }

  removeContentItem(index: number): void {
    this.form.update(f => ({
      ...f,
      content_items: (f.content_items || []).filter((_, i) => i !== index),
    }));
  }

  updateContentItem(index: number, field: keyof ContentItem, value: string): void {
    this.form.update(f => {
      const items = [...(f.content_items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...f, content_items: items };
    });
  }

  // --- Árlista elemek ---

  addPriceListItem(): void {
    this.form.update(f => ({
      ...f,
      price_list_items: [...(f.price_list_items || []), { size: '', description: '', price: 0 }],
    }));
  }

  removePriceListItem(index: number): void {
    this.form.update(f => ({
      ...f,
      price_list_items: (f.price_list_items || []).filter((_, i) => i !== index),
    }));
  }

  updatePriceListItem(index: number, field: keyof PriceListItem, value: string | number): void {
    this.form.update(f => {
      const items = [...(f.price_list_items || [])];
      items[index] = { ...items[index], [field]: field === 'price' ? +value : value };
      return { ...f, price_list_items: items };
    });
  }

  // --- Mennyiségi kedvezmények ---

  addVolumeDiscount(): void {
    this.form.update(f => ({
      ...f,
      volume_discounts: [...(f.volume_discounts || []), { min_quantity: 1, discount_percent: 0 }],
    }));
  }

  removeVolumeDiscount(index: number): void {
    this.form.update(f => ({
      ...f,
      volume_discounts: (f.volume_discounts || []).filter((_, i) => i !== index),
    }));
  }

  updateVolumeDiscount(index: number, field: keyof VolumeDiscount, value: number): void {
    this.form.update(f => {
      const items = [...(f.volume_discounts || [])];
      items[index] = { ...items[index], [field]: +value };
      return { ...f, volume_discounts: items };
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price) + ' Ft';
  }

  onEmailSent(data: { to_email: string; subject: string; body: string }): void {
    this.actions.sendEmail(data);
    this.showEmailDialog.set(false);
  }
}
