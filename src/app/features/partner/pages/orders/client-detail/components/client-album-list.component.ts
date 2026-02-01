import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { PartnerOrdersService, PartnerOrderAlbumSummary } from '../../../../services/partner-orders.service';

/**
 * Client Album List Component
 *
 * Albumok listázása és kezelése:
 * - Album kártyák (navigáció részletekhez)
 * - Státusz váltás (aktiválás/inaktiválás)
 * - Lejárat kezelés
 * - Letöltés engedélyezés toggle
 * - Újranyitás gomb (completed albumoknál)
 */
@Component({
  selector: 'app-client-album-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Albumok ({{ albums().length }})
        </h2>
        <button
          (click)="createAlbum.emit()"
          class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <lucide-icon [name]="ICONS.PLUS" [size]="16" />
          Új album
        </button>
      </div>

      @if (albums().length === 0) {
        <div class="text-center py-8">
          <lucide-icon [name]="ICONS.IMAGE" [size]="48" class="mx-auto text-gray-400 mb-3" />
          <p class="text-gray-600 dark:text-gray-400">
            Még nincs album az ügyfélhez
          </p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (album of albums(); track album.id) {
            <div class="album-card">
              <div
                class="album-card__main"
                [routerLink]="['/partner/orders/albums', album.id]"
              >
                <div class="flex items-center gap-3">
                  <!-- Thumbnail vagy ikon -->
                  @if (album.thumbnails && album.thumbnails.length > 0) {
                    <img
                      [src]="album.thumbnails[0]"
                      class="album-thumb-single"
                      alt=""
                    />
                  } @else {
                    <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <lucide-icon
                        [name]="album.type === 'selection' ? ICONS.GRID : ICONS.FRAME"
                        [size]="24"
                        class="text-primary-600 dark:text-primary-400"
                      />
                    </div>
                  }
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="font-medium text-gray-900 dark:text-white">{{ album.name }}</h3>
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded"
                        [class]="ordersService.getStatusColor(album.status)"
                      >
                        {{ ordersService.getStatusLabel(album.status) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <span>{{ ordersService.getTypeLabel(album.type) }}</span>
                      <span>•</span>
                      <span>{{ album.photosCount }} kép</span>
                    </div>
                  </div>
                </div>

                <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="18" class="text-gray-400" />
              </div>

              <!-- Completed album: letöltés és újranyitás gombok -->
              @if (album.status === 'completed') {
                <div class="album-card__actions" (click)="$event.stopPropagation()">
                  <div class="album-actions">
                    <!-- Letöltés engedélyezés toggle -->
                    <button
                      class="album-download-toggle"
                      [class.album-download-toggle--active]="album.allowDownload"
                      (click)="toggleDownload.emit(album)"
                      [disabled]="togglingDownloadId() === album.id"
                    >
                      @if (togglingDownloadId() === album.id) {
                        <div class="btn-spinner btn-spinner--small"></div>
                      } @else {
                        <lucide-icon [name]="ICONS.DOWNLOAD" [size]="14" />
                        @if (album.allowDownload) {
                          <span>Letöltés ON</span>
                        } @else {
                          <span>Letöltés OFF</span>
                        }
                      }
                    </button>
                    <button
                      class="album-reopen-btn-inline"
                      (click)="reopenAlbum.emit(album)"
                      [disabled]="togglingAlbumId() === album.id"
                    >
                      @if (togglingAlbumId() === album.id) {
                        <div class="btn-spinner btn-spinner--purple"></div>
                      } @else {
                        <lucide-icon [name]="ICONS.REFRESH" [size]="14" />
                        Újranyitás
                      }
                    </button>
                  </div>
                </div>
              }

              <!-- Album lejárat és aktiválás sor - csak nem completed állapotnál -->
              @if (album.status !== 'completed') {
                <div class="album-card__expiry" (click)="$event.stopPropagation()">
                  <div class="album-expiry-info">
                    <lucide-icon [name]="ICONS.CLOCK" [size]="14" />
                    @if (album.expiresAt) {
                      <span>Lejárat: {{ formatExpiryDate(album.expiresAt) }}</span>
                      @if (isAlbumExpired(album.expiresAt)) {
                        <span class="album-expiry-badge album-expiry-badge--expired">Lejárt!</span>
                      }
                    } @else {
                      <span class="text-gray-400">Nincs lejárat</span>
                    }
                  </div>
                  <div class="album-actions">
                    @if (album.expiresAt) {
                      <button
                        class="album-extend-btn"
                        (click)="extendAlbumExpiry.emit({ album, days: 3 })"
                        [disabled]="extendingAlbumId() === album.id"
                        matTooltip="+3 nap"
                      >
                        @if (extendingAlbumId() === album.id) {
                          <div class="btn-spinner"></div>
                        } @else {
                          +3 nap
                        }
                      </button>
                    }
                    @if (album.status === 'draft') {
                      <button
                        class="album-activate-btn"
                        (click)="activateAlbum.emit(album)"
                        [disabled]="togglingAlbumId() === album.id || album.photosCount === 0"
                        [matTooltip]="album.photosCount === 0 ? 'Tölts fel képeket' : 'Aktiválás'"
                      >
                        @if (togglingAlbumId() === album.id) {
                          <div class="btn-spinner btn-spinner--white"></div>
                        } @else {
                          <lucide-icon [name]="ICONS.CHECK" [size]="14" />
                          Aktiválás
                        }
                      </button>
                    } @else {
                      <button
                        class="album-deactivate-btn"
                        (click)="deactivateAlbum.emit(album)"
                        [disabled]="togglingAlbumId() === album.id"
                        matTooltip="Inaktiválás"
                      >
                        @if (togglingAlbumId() === album.id) {
                          <div class="btn-spinner"></div>
                        } @else {
                          <lucide-icon [name]="ICONS.BAN" [size]="14" />
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    /* Album thumbnail stílus */
    .album-thumb-single {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Album kártya stílusok */
    .album-card {
      background: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.15s ease;
    }

    .album-card:hover {
      background: #f3f4f6;
    }

    :host-context(.dark) .album-card {
      background: rgba(55, 65, 81, 0.5);
    }

    :host-context(.dark) .album-card:hover {
      background: #374151;
    }

    .album-card__main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      cursor: pointer;
    }

    .album-card__expiry,
    .album-card__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 8px 16px;
      background: #f1f5f9;
      border-top: 1px solid #e2e8f0;
    }

    .album-card__expiry {
      justify-content: space-between;
    }

    :host-context(.dark) .album-card__expiry,
    :host-context(.dark) .album-card__actions {
      background: rgba(30, 41, 59, 0.5);
      border-color: #334155;
    }

    .album-expiry-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: #64748b;
    }

    :host-context(.dark) .album-expiry-info {
      color: #94a3b8;
    }

    .album-expiry-badge {
      padding: 2px 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      border-radius: 4px;
    }

    .album-expiry-badge--expired {
      background: #fee2e2;
      color: #dc2626;
    }

    :host-context(.dark) .album-expiry-badge--expired {
      background: rgba(220, 38, 38, 0.2);
      color: #f87171;
    }

    .album-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Mobil nézet */
    @media (max-width: 480px) {
      .album-thumb-single,
      .album-card__main .w-12 {
        display: none;
      }

      .album-card__main {
        padding: 12px;
      }

      .album-card__main h3 {
        font-size: 0.875rem;
      }

      .album-card__main .text-sm {
        font-size: 0.75rem;
      }

      .album-card__actions {
        padding: 8px 12px;
      }

      .album-actions {
        width: 100%;
        justify-content: stretch;
      }

      .album-actions > button {
        flex: 1;
        justify-content: center;
      }
    }

    .album-extend-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #3b82f6;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      min-width: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .album-extend-btn:hover:not(:disabled) {
      background: #dbeafe;
      border-color: #93c5fd;
    }

    .album-extend-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-extend-btn {
      background: #1e3a5f;
      border-color: #1e40af;
      color: #93c5fd;
    }

    :host-context(.dark) .album-extend-btn:hover:not(:disabled) {
      background: #1e40af;
    }

    .album-activate-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
      background: #16a34a;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-activate-btn:hover:not(:disabled) {
      background: #15803d;
    }

    .album-activate-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .album-deactivate-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      font-size: 0.75rem;
      color: #d97706;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-deactivate-btn:hover:not(:disabled) {
      background: #fef3c7;
      color: #b45309;
    }

    .album-deactivate-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-deactivate-btn {
      background: rgba(217, 119, 6, 0.1);
      border-color: rgba(217, 119, 6, 0.3);
      color: #fbbf24;
    }

    :host-context(.dark) .album-deactivate-btn:hover:not(:disabled) {
      background: rgba(217, 119, 6, 0.2);
    }

    /* Inline reopen gomb */
    .album-reopen-btn-inline {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #7c3aed;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-reopen-btn-inline:hover:not(:disabled) {
      background: #ede9fe;
      color: #6d28d9;
    }

    .album-reopen-btn-inline:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-reopen-btn-inline {
      background: rgba(124, 58, 237, 0.1);
      border-color: rgba(124, 58, 237, 0.3);
      color: #a78bfa;
    }

    :host-context(.dark) .album-reopen-btn-inline:hover:not(:disabled) {
      background: rgba(124, 58, 237, 0.2);
    }

    /* Letöltés engedélyezés toggle gomb */
    .album-download-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-download-toggle:hover:not(:disabled) {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    .album-download-toggle--active {
      background: #dcfce7;
      border-color: #86efac;
      color: #16a34a;
    }

    .album-download-toggle--active:hover:not(:disabled) {
      background: #bbf7d0;
      border-color: #4ade80;
    }

    .album-download-toggle:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-download-toggle {
      background: #334155;
      border-color: #475569;
      color: #94a3b8;
    }

    :host-context(.dark) .album-download-toggle:hover:not(:disabled) {
      background: #475569;
    }

    :host-context(.dark) .album-download-toggle--active {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.4);
      color: #4ade80;
    }

    :host-context(.dark) .album-download-toggle--active:hover:not(:disabled) {
      background: rgba(34, 197, 94, 0.3);
    }

    .btn-spinner--small {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(100, 116, 139, 0.3);
      border-top-color: #64748b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .btn-spinner--purple {
      border-color: rgba(124, 58, 237, 0.3);
      border-top-color: #7c3aed;
    }

    :host-context(.dark) .btn-spinner--purple {
      border-color: rgba(167, 139, 250, 0.3);
      border-top-color: #a78bfa;
    }

    .btn-spinner--white {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(59, 130, 246, 0.3);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    :host-context(.dark) .btn-spinner {
      border-color: rgba(147, 197, 253, 0.3);
      border-top-color: #93c5fd;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAlbumListComponent {
  protected readonly ICONS = ICONS;
  protected readonly ordersService = inject(PartnerOrdersService);

  /** Albumok listája */
  readonly albums = input.required<PartnerOrderAlbumSummary[]>();

  /** Loading states */
  readonly extendingAlbumId = input<number | null>(null);
  readonly togglingAlbumId = input<number | null>(null);
  readonly togglingDownloadId = input<number | null>(null);

  /** Output events */
  readonly createAlbum = output<void>();
  readonly activateAlbum = output<PartnerOrderAlbumSummary>();
  readonly deactivateAlbum = output<PartnerOrderAlbumSummary>();
  readonly reopenAlbum = output<PartnerOrderAlbumSummary>();
  readonly toggleDownload = output<PartnerOrderAlbumSummary>();
  readonly extendAlbumExpiry = output<{ album: PartnerOrderAlbumSummary; days: number }>();

  isAlbumExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  formatExpiryDate(expiresAt: string | null): string {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
