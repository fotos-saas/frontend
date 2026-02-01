import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { PartnerClientDetails } from '../../../../services/partner-orders.service';
import { formatDateTime } from '../../../../../../shared/utils/formatters.util';

/**
 * Client Header Component
 *
 * Kliens részletek oldal fejléce:
 * - Vissza link
 * - Akció gombok (szerkesztés, törlés, kód inaktiválás)
 * - Kliens név és státusz badge-ek
 * - Email/telefon meta adatok
 */
@Component({
  selector: 'app-client-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, MatTooltipModule],
  template: `
    <!-- Top Bar: Back + Actions -->
    <div class="top-bar">
      <a
        [routerLink]="['/partner/orders/clients']"
        class="back-link"
      >
        <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="16" />
        Vissza
      </a>

      <div class="top-actions">
        @if (client().accessCodeEnabled && client().accessCode) {
          <button
            (click)="disableCode.emit()"
            class="action-btn action-btn--warning"
            matTooltip="Kód inaktiválása"
          >
            <lucide-icon [name]="ICONS.BAN" [size]="18" />
          </button>
        }
        <button
          (click)="edit.emit()"
          class="action-btn"
          matTooltip="Szerkesztés"
        >
          <lucide-icon [name]="ICONS.EDIT" [size]="18" />
        </button>
        <button
          (click)="delete.emit()"
          class="action-btn action-btn--danger"
          [disabled]="client().albumsCount > 0"
          [matTooltip]="client().albumsCount > 0 ? 'Törléshez először töröld az albumokat' : 'Törlés'"
        >
          <lucide-icon [name]="ICONS.DELETE" [size]="18" />
        </button>
      </div>
    </div>

    <!-- Header -->
    <header class="detail-header">
      <h1 class="detail-title">{{ client().name }}</h1>

      <!-- Regisztráció státusz badge-ek -->
      <div class="registration-status-badges">
        @if (client().isRegistered) {
          <span class="status-badge status-badge--registered">
            <lucide-icon [name]="ICONS.USER_CHECK" [size]="14" />
            Regisztrált
          </span>
        } @else if (client().allowRegistration) {
          <span class="status-badge status-badge--allowed">
            <lucide-icon [name]="ICONS.USER_PLUS" [size]="14" />
            Regisztráció engedélyezve
          </span>
        } @else {
          <span class="status-badge status-badge--disabled">
            <lucide-icon [name]="ICONS.USER_X" [size]="14" />
            Regisztráció nincs engedélyezve
          </span>
        }
      </div>

      <div class="detail-meta">
        @if (client().email) {
          <span class="meta-item">
            <lucide-icon [name]="ICONS.MAIL" [size]="14" />
            {{ client().email }}
          </span>
        }
        @if (client().email && client().phone) {
          <span class="meta-separator">·</span>
        }
        @if (client().phone) {
          <span class="meta-item">
            <lucide-icon [name]="ICONS.PHONE" [size]="14" />
            {{ client().phone }}
          </span>
        }
      </div>
    </header>

    <!-- Note -->
    @if (client().note) {
      <div class="note-box">
        <h3 class="note-title">Megjegyzés</h3>
        <p class="note-text">{{ client().note }}</p>
      </div>
    }

    <!-- Timestamps -->
    <div class="detail-timestamps">
      <span>Létrehozva: {{ formatDate(client().createdAt) }}</span>
      <span>Módosítva: {{ formatDate(client().updatedAt) }}</span>
    </div>
  `,
  styles: [`
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 0.875rem;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .back-link:hover {
      color: var(--color-text-primary, #1e293b);
    }

    :host-context(.dark) .back-link:hover {
      color: #f1f5f9;
    }

    .top-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .action-btn:hover:not(:disabled) {
      background: #f1f5f9;
      color: var(--color-primary, #1e3a5f);
      border-color: var(--color-primary, #1e3a5f);
    }

    .action-btn:disabled {
      color: #cbd5e1;
      cursor: not-allowed;
    }

    .action-btn--danger:hover:not(:disabled) {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    .action-btn--warning:hover:not(:disabled) {
      background: #fffbeb;
      color: #d97706;
      border-color: #fde68a;
    }

    .detail-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .detail-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary, #1e293b);
      margin: 0 0 8px 0;
    }

    :host-context(.dark) .detail-title {
      color: #f8fafc;
    }

    .registration-status-badges {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: 20px;
    }

    .status-badge--registered {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    :host-context(.dark) .status-badge--registered {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .status-badge--allowed {
      background: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
    }

    :host-context(.dark) .status-badge--allowed {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .status-badge--disabled {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    :host-context(.dark) .status-badge--disabled {
      background: rgba(100, 116, 139, 0.15);
      color: #94a3b8;
      border-color: rgba(100, 116, 139, 0.3);
    }

    .detail-meta {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      color: #64748b;
      font-size: 0.875rem;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .meta-separator {
      color: #cbd5e1;
    }

    .note-box {
      margin-top: 24px;
      padding: 16px;
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: 12px;
    }

    :host-context(.dark) .note-box {
      background: rgba(234, 179, 8, 0.1);
      border-color: rgba(234, 179, 8, 0.3);
    }

    .note-title {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #854d0e;
    }

    :host-context(.dark) .note-title {
      color: #fde047;
    }

    .note-text {
      margin: 0;
      font-size: 0.875rem;
      color: #a16207;
    }

    :host-context(.dark) .note-text {
      color: #fef08a;
    }

    .detail-timestamps {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 32px;
      padding-top: 24px;
      color: #94a3b8;
      font-size: 0.8125rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientHeaderComponent {
  protected readonly ICONS = ICONS;

  /** Kliens adatok */
  readonly client = input.required<PartnerClientDetails>();

  /** Output events */
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly disableCode = output<void>();

  formatDate(date: string | null): string {
    return formatDateTime(date);
  }
}
