import { Component, input } from '@angular/core';
import { BillingChargeStatus, STATUS_LABELS } from '../models/billing.models';

@Component({
  selector: 'app-billing-status-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="'badge--' + status()">
      {{ label() }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge--pending {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
    }
    .badge--paid {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge--cancelled {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .badge--refunded {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
  `]
})
export class BillingStatusBadgeComponent {
  readonly status = input.required<BillingChargeStatus>();

  label(): string {
    return STATUS_LABELS[this.status()] ?? this.status();
  }
}
