import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { ICONS } from '@shared/constants';
import { QuoteListActionsService } from './quote-list-actions.service';
import { Quote, QUOTE_STATUS_CONFIG } from '../../../models/quote.models';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { TemplateChooserDialogComponent } from '../components/template-chooser-dialog/template-chooser-dialog.component';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    NgClass,
    ConfirmDialogComponent,
    TemplateChooserDialogComponent,
  ],
  providers: [QuoteListActionsService],
  templateUrl: './quote-list.component.html',
  styleUrl: './quote-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteListComponent implements OnInit {
  protected readonly actions = inject(QuoteListActionsService);
  protected readonly router = inject(Router);
  protected readonly ICONS = ICONS;
  protected readonly STATUS_CONFIG = QUOTE_STATUS_CONFIG;

  protected showDeleteConfirm = signal(false);
  protected deleteTarget = signal<Quote | null>(null);
  protected showTemplateChooser = signal(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.actions.loadQuotes();
    this.actions.loadTemplates();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.actions.search.set(value);
      this.actions.currentPage.set(1);
      this.actions.loadQuotes();
    }, 400);
  }

  onStatusFilter(event: Event): void {
    this.actions.statusFilter.set((event.target as HTMLSelectElement).value);
    this.actions.currentPage.set(1);
    this.actions.loadQuotes();
  }

  goToPage(page: number): void {
    this.actions.currentPage.set(page);
    this.actions.loadQuotes();
  }

  confirmDelete(quote: Quote): void {
    this.deleteTarget.set(quote);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmed(): void {
    const target = this.deleteTarget();
    if (target) {
      this.actions.deleteQuote(target);
    }
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price) + ' Ft';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('hu-HU');
  }
}
