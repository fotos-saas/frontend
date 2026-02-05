import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerClientDetails } from '../../../../../services/partner-orders.service';
import { formatDateTime } from '../../../../../../../shared/utils/formatters.util';

/**
 * Client Access Code Component
 *
 * Belépési kód kezelése:
 * - Kód megjelenítés és másolás
 * - Lejárat dátum módosítás
 * - Gyors hosszabbítás gombok
 * - Kód generálás (ha nincs)
 */
@Component({
  selector: 'app-client-access-code',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Belépési kód</h2>

      @if (client().accessCodeEnabled && client().accessCode) {
        <div class="flex flex-col gap-4">
          <!-- Code + Copy -->
          <div class="flex items-center gap-4">
            <div class="text-3xl font-mono font-bold tracking-widest text-primary-600 dark:text-primary-400 select-all">
              {{ client().accessCode }}
            </div>
            <button
              (click)="copyCode.emit()"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              matTooltip="Másolás"
            >
              <lucide-icon [name]="ICONS.COPY" [size]="18" />
            </button>
          </div>

          <!-- Expiry info + controls -->
          <div class="expiry-section">
            <div class="expiry-row">
              <span class="expiry-label">Lejárat:</span>
              <input
                type="date"
                [value]="getExpiryDateValue()"
                (change)="onExpiryDateChange($event)"
                [min]="getTomorrowDate()"
                class="expiry-input"
                [disabled]="extendingCode()"
              />
              @if (isCodeExpired()) {
                <span class="expiry-badge expiry-badge--expired">Lejárt!</span>
              }
            </div>

            <div class="expiry-row">
              <span class="expiry-label">Gyors:</span>
              <div class="extend-buttons">
                <button
                  (click)="extendExpiry.emit(3)"
                  [disabled]="extendingCode()"
                  class="extend-btn"
                >
                  +3 nap
                </button>
                <button
                  (click)="extendExpiry.emit(7)"
                  [disabled]="extendingCode()"
                  class="extend-btn"
                >
                  +1 hét
                </button>
                <button
                  (click)="extendExpiry.emit(14)"
                  [disabled]="extendingCode()"
                  class="extend-btn"
                >
                  +2 hét
                </button>
                <button
                  (click)="extendExpiry.emit(30)"
                  [disabled]="extendingCode()"
                  class="extend-btn"
                >
                  +1 hónap
                </button>
              </div>
            </div>
          </div>

          @if (client().lastLoginAt) {
            <p class="text-sm text-gray-500">
              Utolsó belépés: {{ formatDate(client().lastLoginAt) }}
            </p>
          }
        </div>
      } @else {
        <div class="text-center py-6">
          <lucide-icon [name]="ICONS.KEY" [size]="48" class="mx-auto text-gray-400 mb-3" />
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Az ügyfélnek nincs aktív belépési kódja
          </p>
          <button
            (click)="generateCode.emit()"
            [disabled]="generatingCode()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            @if (generatingCode()) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            } @else {
              <lucide-icon [name]="ICONS.REFRESH" [size]="18" />
            }
            Kód generálása
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .expiry-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    :host-context(.dark) .expiry-section {
      background: #1e293b;
      border-color: #334155;
    }

    .expiry-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .expiry-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      min-width: 60px;
    }

    .expiry-input {
      padding: 6px 12px;
      font-size: 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #1e293b;
      cursor: pointer;
    }

    .expiry-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    :host-context(.dark) .expiry-input {
      background: #0f172a;
      border-color: #475569;
      color: #f1f5f9;
    }

    .expiry-badge {
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
    }

    .expiry-badge--expired {
      background: #fee2e2;
      color: #dc2626;
    }

    :host-context(.dark) .expiry-badge--expired {
      background: rgba(220, 38, 38, 0.2);
      color: #f87171;
    }

    .extend-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .extend-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #3b82f6;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .extend-btn:hover:not(:disabled) {
      background: #dbeafe;
      border-color: #93c5fd;
    }

    .extend-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host-context(.dark) .extend-btn {
      background: #1e3a5f;
      border-color: #1e40af;
      color: #93c5fd;
    }

    :host-context(.dark) .extend-btn:hover:not(:disabled) {
      background: #1e40af;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAccessCodeComponent {
  protected readonly ICONS = ICONS;

  /** Kliens adatok */
  readonly client = input.required<PartnerClientDetails>();

  /** Loading states */
  readonly extendingCode = input<boolean>(false);
  readonly generatingCode = input<boolean>(false);

  /** Output events */
  readonly copyCode = output<void>();
  readonly generateCode = output<void>();
  readonly extendExpiry = output<number>();
  readonly expiryDateChange = output<string>();

  isCodeExpired(): boolean {
    const expiresAt = this.client()?.accessCodeExpiresAt;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  getExpiryDateValue(): string {
    const expiresAt = this.client()?.accessCodeExpiresAt;
    if (!expiresAt) return '';
    return new Date(expiresAt).toISOString().split('T')[0];
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  onExpiryDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.expiryDateChange.emit(input.value);
    }
  }

  formatDate(date: string | null): string {
    return formatDateTime(date);
  }
}
