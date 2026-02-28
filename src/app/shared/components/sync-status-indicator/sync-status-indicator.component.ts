import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ElectronSyncService } from '../../../core/services/electron-sync.service';
import { ElectronService } from '../../../core/services/electron.service';
import { ICONS } from '../../constants/icons.constants';
import type { SyncState } from '../../../core/services/electron.types';

@Component({
  selector: 'app-sync-status-indicator',
  standalone: true,
  imports: [MatTooltipModule, LucideAngularModule],
  template: `
    @if (isElectron && syncEnabled()) {
      <button
        class="sync-indicator"
        [class]="stateClass()"
        [matTooltip]="tooltipText()"
        matTooltipPosition="below"
        type="button"
      >
        <lucide-icon [name]="iconName()" [size]="18" />
        @if (isSyncing()) {
          <span class="sync-spinner"></span>
        }
      </button>
    }
  `,
  styles: [`
    :host { display: contents; }

    .sync-indicator {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background-color 0.15s, color 0.15s;
    }

    .sync-indicator:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .sync-indicator:focus-visible {
      outline: 2px solid #a855f7;
      outline-offset: 2px;
    }

    /* Állapotok */
    .sync-disabled { color: #94a3b8; }
    .sync-searching { color: #eab308; }
    .sync-idle { color: #22c55e; }
    .sync-syncing { color: #3b82f6; }
    .sync-error { color: #ef4444; }

    /* Kereső pulzálás */
    .sync-searching lucide-icon {
      animation: pulse-search 2s ease-in-out infinite;
    }

    /* Szinkronizáló spinner */
    .sync-spinner {
      position: absolute;
      inset: 2px;
      border-radius: 50%;
      border: 2px solid transparent;
      border-top-color: #3b82f6;
      animation: spin 1s linear infinite;
    }

    @keyframes pulse-search {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .sync-searching lucide-icon,
      .sync-spinner {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncStatusIndicatorComponent {
  private readonly syncService = inject(ElectronSyncService);
  private readonly electronService = inject(ElectronService);

  readonly isElectron = this.electronService.isElectron;
  readonly ICONS = ICONS;

  readonly syncEnabled = this.syncService.syncEnabled;
  readonly isSyncing = this.syncService.isSyncing;

  private readonly STATE_MAP: Record<SyncState, { icon: string; tooltip: string; class: string }> = {
    disabled: { icon: ICONS.WIFI_OFF, tooltip: 'LAN sync: Kikapcsolva', class: 'sync-disabled' },
    searching: { icon: ICONS.WIFI, tooltip: 'LAN sync: Eszközök keresése...', class: 'sync-searching' },
    idle: { icon: ICONS.WIFI, tooltip: 'LAN sync: Szinkronban', class: 'sync-idle' },
    syncing: { icon: ICONS.REFRESH, tooltip: '', class: 'sync-syncing' },
    error: { icon: ICONS.WIFI_OFF, tooltip: 'LAN sync: Szinkronizálási hiba', class: 'sync-error' },
  };

  readonly iconName = computed(() =>
    this.STATE_MAP[this.syncService.syncState()]?.icon || ICONS.WIFI_OFF
  );

  readonly stateClass = computed(() =>
    `sync-indicator ${this.STATE_MAP[this.syncService.syncState()]?.class || 'sync-disabled'}`
  );

  readonly tooltipText = computed(() => {
    const state = this.syncService.syncState();
    if (state === 'syncing') {
      const transfer = this.syncService.currentTransfer();
      if (transfer) {
        return `LAN sync: Szinkronizálás (${transfer.fileName}, ${transfer.percent}%)`;
      }
      return 'LAN sync: Szinkronizálás...';
    }
    return this.STATE_MAP[state]?.tooltip || 'LAN sync';
  });
}
