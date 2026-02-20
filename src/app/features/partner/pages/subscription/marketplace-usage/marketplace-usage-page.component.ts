import { Component, OnInit, inject, signal } from '@angular/core';
import { MarketplaceService } from '../../../services/marketplace.service';
import { UsageResponse } from '../../../models/marketplace.models';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-marketplace-usage-page',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe, DatePipe],
  templateUrl: './marketplace-usage-page.component.html',
  styleUrl: './marketplace-usage-page.component.scss',
})
export class MarketplaceUsagePageComponent implements OnInit {
  private readonly marketplaceService = inject(MarketplaceService);

  readonly ICONS = ICONS;
  readonly loading = signal(true);
  readonly usage = signal<UsageResponse | null>(null);
  readonly selectedMonth = signal(new Date().toISOString().slice(0, 7)); // YYYY-MM

  ngOnInit(): void {
    this.loadUsage();
  }

  loadUsage(): void {
    this.loading.set(true);
    this.marketplaceService.getUsage(this.selectedMonth()).subscribe({
      next: data => {
        this.usage.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeMonth(delta: number): void {
    const current = new Date(this.selectedMonth() + '-01');
    current.setMonth(current.getMonth() + delta);
    this.selectedMonth.set(current.toISOString().slice(0, 7));
    this.loadUsage();
  }

  formatMonth(): string {
    const date = new Date(this.selectedMonth() + '-01');
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
  }
}
