import { Component, inject, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { OfflineService } from '../../../core/services/offline.service';
import { ICONS } from '../../constants/icons.constants';

/**
 * Offline Banner komponens
 *
 * Megjelenik amikor az app offline modban van.
 * Mutatja:
 * - Offline allapot jelzeset
 * - Varakozo valtozasok szamat
 * - Utolso szinkronizalas idejet
 * - Szinkronizalas folyamat jelzeset
 */
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (showBanner()) {
      <div class="offline-banner" [class.syncing]="offlineService.isSyncing()">
        <div class="banner-content">
          <div class="status-icon">
            @if (offlineService.isSyncing()) {
              <lucide-icon [name]="ICONS.LOADER" [size]="20" class="spin" />
            } @else {
              <lucide-icon [name]="ICONS.WIFI_OFF" [size]="20" />
            }
          </div>

          <div class="message">
            @if (offlineService.isSyncing()) {
              <span class="title">Szinkronizalas folyamatban...</span>
            } @else if (offlineService.isOffline()) {
              <span class="title">Offline modban dolgozol</span>
              <span class="subtitle">A valtozasok automatikusan szinkronizalodnak, ha ujra online leszel.</span>
            } @else if (hasPendingRequests()) {
              <span class="title">Szinkronizalas szukseges</span>
              <span class="subtitle">{{ pendingRequestsText() }}</span>
            }
          </div>

          @if (hasPendingRequests() && !offlineService.isOffline() && !offlineService.isSyncing()) {
            <button class="sync-btn" (click)="syncNow()">
              <lucide-icon [name]="ICONS.REFRESH" [size]="16" />
              Szinkronizalas
            </button>
          }

          @if (offlineService.lastSync()) {
            <div class="last-sync">
              Utolso szinkronizalas: {{ lastSyncFormatted() }}
            </div>
          }
        </div>

        @if (hasPendingRequests()) {
          <div class="pending-badge">
            {{ offlineService.pendingRequests() }}
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: slideDown 0.3s ease-out;
    }

    .offline-banner.syncing {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 1200px;
      width: 100%;
    }

    .status-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .message {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .title {
      font-weight: 600;
      font-size: 14px;
    }

    .subtitle {
      font-size: 12px;
      opacity: 0.9;
    }

    .sync-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sync-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .last-sync {
      font-size: 11px;
      opacity: 0.75;
      white-space: nowrap;
    }

    .pending-badge {
      position: absolute;
      top: -6px;
      right: 16px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: #ef4444;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 640px) {
      .banner-content {
        flex-wrap: wrap;
      }

      .last-sync {
        display: none;
      }
    }

    /* A11y - Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .offline-banner {
        animation: none;
      }

      .spin {
        animation: none;
      }
    }
  `]
})
export class OfflineBannerComponent {
  readonly offlineService = inject(OfflineService);
  readonly ICONS = ICONS;

  readonly showBanner = computed(() =>
    this.offlineService.isOffline() ||
    this.offlineService.isSyncing() ||
    this.offlineService.pendingRequests() > 0
  );

  readonly hasPendingRequests = computed(() =>
    this.offlineService.pendingRequests() > 0
  );

  readonly pendingRequestsText = computed(() => {
    const count = this.offlineService.pendingRequests();
    return count === 1
      ? '1 valtozas var szinkronizalasra'
      : `${count} valtozas var szinkronizalasra`;
  });

  readonly lastSyncFormatted = computed(() => {
    const lastSync = this.offlineService.lastSync();
    if (!lastSync) return '';

    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'most';
    if (minutes < 60) return `${minutes} perce`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} oraja`;

    return lastSync.toLocaleDateString('hu-HU');
  });

  async syncNow(): Promise<void> {
    await this.offlineService.processQueue();
  }
}
