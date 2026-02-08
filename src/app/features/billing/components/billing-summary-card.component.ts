import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BillingSummary } from '../models/billing.models';

@Component({
  selector: 'app-billing-summary-card',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './billing-summary-card.component.html',
  styleUrl: './billing-summary-card.component.scss',
})
export class BillingSummaryCardComponent {
  readonly summary = input.required<BillingSummary>();
  readonly ICONS = ICONS;
}
