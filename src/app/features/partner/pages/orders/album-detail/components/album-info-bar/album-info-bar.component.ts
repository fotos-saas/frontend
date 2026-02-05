import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerOrderAlbumDetails } from '../../../../../services/partner-orders.service';

/**
 * Album Info Bar Component
 *
 * Kompakt info sáv: statisztikák, nézet váltó, lejárat kezelés.
 */
@Component({
  selector: 'app-album-info-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="album-info-bar">
      <div class="info-stats">
        <span class="info-stat">
          <strong>{{ album().photosCount }}</strong> kép
        </span>
        @if (album().type === 'selection') {
          <span class="info-stat info-stat--selection" [class.info-stat--complete]="selectedCount() >= (album().minSelections || 1)">
            <strong>{{ selectedCount() }}</strong> kiválasztva
            @if (album().minSelections || album().maxSelections) {
              <span class="info-hint">(@if (album().minSelections) {min. {{ album().minSelections }}}@if (album().minSelections && album().maxSelections) {, }@if (album().maxSelections) {max. {{ album().maxSelections }}})</span>
            }
          </span>
        }
        @if (album().type === 'tablo' && album().maxRetouchPhotos) {
          <span class="info-stat">
            <strong>{{ album().maxRetouchPhotos }}</strong> retusálás
          </span>
        }
      </div>

      <div class="info-actions">
        <!-- Nézet váltó -->
        <div class="view-switcher">
          <button
            (click)="viewModeChange.emit('grid')"
            [class.view-switcher__btn--active]="viewMode() === 'grid'"
            class="view-switcher__btn"
            matTooltip="Rács nézet"
          >
            <lucide-icon [name]="ICONS.GRID" [size]="18" />
          </button>
          <button
            (click)="viewModeChange.emit('list')"
            [class.view-switcher__btn--active]="viewMode() === 'list'"
            class="view-switcher__btn"
            matTooltip="Lista nézet"
          >
            <lucide-icon [name]="ICONS.LIST" [size]="18" />
          </button>
        </div>

        @if (album().expiresAt && album().status !== 'completed') {
          <div class="info-expiry">
            <lucide-icon [name]="ICONS.CLOCK" [size]="14" />
            <input
              type="date"
              [value]="expiryDateValue()"
              (change)="onExpiryChange($event)"
              [min]="tomorrowDate()"
              class="expiry-input-compact"
              [disabled]="extendingExpiry()"
            />
            @if (isExpired()) {
              <span class="expiry-badge-compact">Lejárt!</span>
            }
            <button
              (click)="extendExpiry.emit(3)"
              [disabled]="extendingExpiry()"
              class="extend-btn-compact"
              matTooltip="+3 nap"
            >
              +3
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .album-info-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    :host-context(.dark) .album-info-bar {
      background: rgba(30, 41, 59, 0.5);
      border-color: #334155;
    }

    .info-stats {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .info-stat {
      font-size: 0.875rem;
      color: #64748b;
    }

    .info-stat strong {
      color: #1e293b;
      font-weight: 600;
    }

    :host-context(.dark) .info-stat {
      color: #94a3b8;
    }

    :host-context(.dark) .info-stat strong {
      color: #f1f5f9;
    }

    .info-stat--selection {
      padding: 4px 10px;
      background: #fef3c7;
      border-radius: 6px;
      color: #92400e;
    }

    .info-stat--selection strong {
      color: #92400e;
    }

    :host-context(.dark) .info-stat--selection {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }

    :host-context(.dark) .info-stat--selection strong {
      color: #fbbf24;
    }

    .info-stat--complete {
      background: #dcfce7;
      color: #166534;
    }

    .info-stat--complete strong {
      color: #166534;
    }

    :host-context(.dark) .info-stat--complete {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    :host-context(.dark) .info-stat--complete strong {
      color: #4ade80;
    }

    .info-hint {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-left: 2px;
    }

    .info-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .view-switcher {
      display: flex;
      background: #e2e8f0;
      border-radius: 6px;
      padding: 2px;
    }

    :host-context(.dark) .view-switcher {
      background: #334155;
    }

    .view-switcher__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .view-switcher__btn:hover {
      color: #1e293b;
    }

    :host-context(.dark) .view-switcher__btn:hover {
      color: #f1f5f9;
    }

    .view-switcher__btn--active {
      background: white;
      color: var(--color-primary, #1e3a5f);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    :host-context(.dark) .view-switcher__btn--active {
      background: #1e293b;
      color: #60a5fa;
    }

    .info-expiry {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
    }

    :host-context(.dark) .info-expiry {
      color: #94a3b8;
    }

    .expiry-input-compact {
      padding: 4px 8px;
      font-size: 0.8125rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: white;
      color: #1e293b;
      cursor: pointer;
      width: 130px;
    }

    .expiry-input-compact:focus {
      outline: none;
      border-color: #3b82f6;
    }

    :host-context(.dark) .expiry-input-compact {
      background: #0f172a;
      border-color: #475569;
      color: #f1f5f9;
    }

    .expiry-badge-compact {
      padding: 2px 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 4px;
    }

    :host-context(.dark) .expiry-badge-compact {
      background: rgba(220, 38, 38, 0.2);
      color: #f87171;
    }

    .extend-btn-compact {
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #3b82f6;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .extend-btn-compact:hover:not(:disabled) {
      background: #dbeafe;
    }

    .extend-btn-compact:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host-context(.dark) .extend-btn-compact {
      background: #1e3a5f;
      border-color: #1e40af;
      color: #93c5fd;
    }
  `]
})
export class AlbumInfoBarComponent {
  readonly ICONS = ICONS;

  // Inputs (Signal-based)
  readonly album = input.required<PartnerOrderAlbumDetails>();
  readonly viewMode = input.required<'grid' | 'list'>();
  readonly selectedCount = input<number>(0);
  readonly extendingExpiry = input<boolean>(false);
  readonly expiryDateValue = input<string>('');
  readonly tomorrowDate = input<string>('');
  readonly isExpired = input<boolean>(false);

  // Outputs
  readonly viewModeChange = output<'grid' | 'list'>();
  readonly expiryChange = output<string>();
  readonly extendExpiry = output<number>();

  onExpiryChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.expiryChange.emit(input.value);
    }
  }
}
