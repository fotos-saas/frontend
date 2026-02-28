import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ElectronSyncService } from '../../../../../../core/services/electron-sync.service';
import { ElectronService } from '../../../../../../core/services/electron.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import type { SyncState } from '../../../../../../core/services/electron.types';

@Component({
  selector: 'app-sync-settings-card',
  standalone: true,
  imports: [DatePipe, MatTooltipModule, LucideAngularModule],
  templateUrl: './sync-settings-card.component.html',
  styleUrl: './sync-settings-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncSettingsCardComponent {
  readonly syncService = inject(ElectronSyncService);
  private readonly electronService = inject(ElectronService);
  private readonly authService = inject(AuthService);

  readonly ICONS = ICONS;
  readonly isElectron = this.electronService.isElectron;

  // Párosítás UI állapot
  readonly showPairingDialog = signal(false);
  readonly pairingMode = signal<'generate' | 'accept'>('generate');
  private pendingPeerId: string | null = null;

  private readonly STATUS_MAP: Record<SyncState, { text: string; dotClass: string }> = {
    disabled: { text: 'Kikapcsolva', dotClass: 'dot-gray' },
    searching: { text: 'Eszközök keresése...', dotClass: 'dot-yellow' },
    idle: { text: 'Szinkronban', dotClass: 'dot-green' },
    syncing: { text: 'Szinkronizálás...', dotClass: 'dot-blue' },
    error: { text: 'Szinkronizálási hiba', dotClass: 'dot-red' },
  };

  readonly statusText = computed(() =>
    this.STATUS_MAP[this.syncService.syncState()]?.text || 'Ismeretlen'
  );

  readonly statusDotClass = computed(() =>
    `status-dot ${this.STATUS_MAP[this.syncService.syncState()]?.dotClass || 'dot-gray'}`
  );

  async toggleSync(): Promise<void> {
    if (this.syncService.syncEnabled()) {
      await this.syncService.disable();
    } else {
      // Workspace path = Photoshop work dir
      const workDir = await window.electronAPI?.photoshop?.getWorkDir() ?? '';
      const userId = this.authService.currentUserSignal()?.id?.toString() || '0';

      if (!workDir) {
        // Ha nincs workspace beállítva, nem indítunk sync-et
        return;
      }
      await this.syncService.enable(userId, workDir);
    }
  }

  startPairing(peerId: string): void {
    this.pendingPeerId = peerId;
    this.pairingMode.set('accept');
    this.showPairingDialog.set(true);
  }

  async showPairActions(): Promise<void> {
    this.pairingMode.set('generate');
    await this.syncService.generatePairingCode();
    this.showPairingDialog.set(true);
  }

  async submitPairingCode(code: string): Promise<void> {
    if (!code || code.length !== 6) return;
    if (this.pendingPeerId) {
      await this.syncService.pairWithPeer(this.pendingPeerId, code);
    }
    this.cancelPairing();
  }

  cancelPairing(): void {
    this.showPairingDialog.set(false);
    this.pendingPeerId = null;
  }

  async unpairPeer(peerId: string): Promise<void> {
    await this.syncService.unpair(peerId);
  }
}
