import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SubscriptionInfo } from '../../../services/subscription.service';
import { ICONS } from '../../../../../shared/constants/icons.constants';

/**
 * Subscription Card Component
 *
 * Előfizetési információk megjelenítése kártyán.
 */
@Component({
  selector: 'app-subscription-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div class="subscription-card">
      <!-- Header -->
      <div class="card-header">
        <div class="plan-info">
          <span class="plan-badge" [class]="'plan-badge--' + info().plan">
            {{ info().plan_name }}
          </span>
          <span class="status-badge" [class]="'status-badge--' + info().status">
            {{ getStatusLabel() }}
          </span>
        </div>
        <span class="billing-cycle">
          {{ info().billing_cycle === 'yearly' ? 'Éves' : 'Havi' }} számlázás
        </span>
      </div>

      <!-- Details -->
      <div class="card-details">
        <div class="detail-row">
          <span class="detail-label">
            <lucide-icon [name]="ICONS.HARD_DRIVE" [size]="16" />
            Tárhely limit
          </span>
          <span class="detail-value">{{ info().limits.storage_gb }} GB</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">
            <lucide-icon [name]="ICONS.USERS" [size]="16" />
            Osztályok
          </span>
          <span class="detail-value">
            {{ info().limits.max_classes !== null ? info().limits.max_classes : 'Korlátlan' }}
          </span>
        </div>

        @if (info().current_period_end) {
          <div class="detail-row">
            <span class="detail-label">
              <lucide-icon [name]="ICONS.CALENDAR" [size]="16" />
              Következő számlázás
            </span>
            <span class="detail-value">
              {{ info().current_period_end | date:'yyyy. MM. dd.' }}
            </span>
          </div>
        }

        @if (info().cancel_at_period_end) {
          <div class="detail-row detail-row--warning">
            <span class="detail-label">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
              Lemondva
            </span>
            <span class="detail-value">
              Lejár: {{ info().current_period_end | date:'yyyy. MM. dd.' }}
            </span>
          </div>
        }
      </div>

      <!-- Features -->
      @if (info().features.length > 0) {
        <div class="card-features">
          <h4>Funkciók:</h4>
          <ul class="feature-list">
            @for (feature of info().features; track feature) {
              <li>
                <lucide-icon [name]="ICONS.CHECK" [size]="14" class="check-icon" />
                {{ getFeatureLabel(feature) }}
              </li>
            }
          </ul>
        </div>
      }

      <!-- Actions -->
      <div class="card-actions">
        <button class="btn btn--secondary" (click)="openPortal.emit()">
          <lucide-icon [name]="ICONS.CREDIT_CARD" [size]="18" />
          Csomag váltása / Fizetési adatok
        </button>
      </div>
    </div>
  `,
  styles: [`
    .subscription-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid var(--border-color, #e2e8f0);
    }

    /* ============ Header ============ */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .plan-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .plan-badge {
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .plan-badge--alap {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
    }

    .plan-badge--iskola {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .plan-badge--studio {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge--active {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge--trial {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge--paused {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge--canceling {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge--canceled {
      background: #f1f5f9;
      color: #475569;
    }

    .status-badge--pending {
      background: #f1f5f9;
      color: #64748b;
    }

    .billing-cycle {
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }

    /* ============ Details ============ */
    .card-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
      border-top: 1px solid var(--border-color, #e2e8f0);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }

    .detail-value {
      font-weight: 500;
      color: var(--text-primary, #1e293b);
    }

    .detail-row--warning .detail-label,
    .detail-row--warning .detail-value {
      color: var(--color-warning, #d97706);
    }

    /* ============ Features ============ */
    .card-features {
      padding: 16px 0;
    }

    .card-features h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0 0 12px 0;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }

    .feature-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }

    .check-icon {
      color: #22c55e;
      flex-shrink: 0;
    }

    /* ============ Actions ============ */
    .card-actions {
      padding-top: 16px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn--secondary {
      background: var(--bg-secondary, #f1f5f9);
      color: var(--text-primary, #1e293b);
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .btn--secondary:hover {
      background: var(--bg-hover, #e2e8f0);
    }

    /* ============ Responsive ============ */
    @media (max-width: 480px) {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .feature-list {
        grid-template-columns: 1fr;
      }
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .btn {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionCardComponent {
  info = input.required<SubscriptionInfo>();
  openPortal = output<void>();

  protected readonly ICONS = ICONS;

  getStatusLabel(): string {
    const labels: Record<string, string> = {
      active: 'Aktív',
      trial: 'Próbaidőszak',
      paused: 'Szüneteltetve',
      canceling: 'Lemondva',
      canceled: 'Lejárt',
      pending: 'Függőben'
    };
    return labels[this.info().status] ?? this.info().status;
  }

  getFeatureLabel(feature: string): string {
    const labels: Record<string, string> = {
      online_selection: 'Online képválasztás',
      templates: 'Sablonok',
      qr_sharing: 'QR megosztás',
      email_support: 'Email támogatás',
      subdomain: 'Aldomain',
      stripe_payments: 'Online fizetés',
      sms_notifications: 'SMS értesítések',
      priority_support: 'Prioritásos támogatás',
      custom_domain: 'Egyedi domain',
      white_label: 'Fehér címke',
      api_access: 'API hozzáférés',
      dedicated_support: 'Dedikált támogatás'
    };
    return labels[feature] ?? feature;
  }
}
