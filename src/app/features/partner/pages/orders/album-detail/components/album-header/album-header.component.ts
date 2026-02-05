import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerOrderAlbumDetails, PartnerOrdersService } from '../../../../../services/partner-orders.service';

/**
 * Album Header Component
 *
 * Megjeleníti az album fejlécét: vissza link, cím, státusz, action gombok.
 */
@Component({
  selector: 'app-album-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, LucideAngularModule, MatTooltipModule],
  template: `
    <!-- Top Bar: Back + Actions -->
    <div class="top-bar">
      <a
        [routerLink]="['/partner/orders/clients', album().client.id]"
        class="back-link"
      >
        <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="16" />
        Vissza
      </a>

      <div class="top-actions">
        @if (album().status === 'draft') {
          <button
            (click)="activate.emit()"
            [disabled]="album().photosCount === 0 || activating()"
            class="btn-activate"
            [matTooltip]="album().photosCount === 0 ? 'Tölts fel képeket az aktiváláshoz' : 'Aktiválás'"
          >
            @if (activating()) {
              <div class="spinner"></div>
            } @else {
              <lucide-icon [name]="ICONS.CHECK" [size]="18" />
            }
            Aktiválás
          </button>
        }
        <button
          (click)="edit.emit()"
          [disabled]="album().status === 'completed'"
          class="action-btn"
          matTooltip="Szerkesztés"
        >
          <lucide-icon [name]="ICONS.EDIT" [size]="18" />
        </button>
        <button
          (click)="delete.emit()"
          [disabled]="album().status === 'completed'"
          class="action-btn action-btn--danger"
          matTooltip="Törlés"
        >
          <lucide-icon [name]="ICONS.DELETE" [size]="18" />
        </button>
      </div>
    </div>

    <!-- Header -->
    <header class="detail-header">
      <h1 class="detail-title">{{ album().name }}</h1>
      <div class="detail-meta">
        <span>{{ album().client.name }}</span>
        <span
          class="status-badge"
          [class]="ordersService.getStatusColor(album().status)"
        >
          {{ ordersService.getStatusLabel(album().status) }}
        </span>
        <span class="type-label">
          {{ ordersService.getTypeLabel(album().type) }}
        </span>
      </div>
    </header>
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

    .btn-activate {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #16a34a;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-activate:hover:not(:disabled) {
      background: #15803d;
    }

    .btn-activate:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .detail-meta {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      color: #64748b;
      font-size: 0.875rem;
    }

    .status-badge {
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 4px;
    }

    .type-label {
      color: #94a3b8;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AlbumHeaderComponent {
  readonly ICONS = ICONS;
  readonly ordersService = inject(PartnerOrdersService);

  // Inputs (Signal-based)
  readonly album = input.required<PartnerOrderAlbumDetails>();
  readonly activating = input<boolean>(false);

  // Outputs
  readonly activate = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
}
