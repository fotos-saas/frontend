import {
  Component, ChangeDetectionStrategy, signal, computed,
  OnInit, DestroyRef, inject, NgZone,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayContext, ActiveDocInfo } from '../../core/services/electron.types';

interface ToolbarItem {
  id: string;
  icon: string;
  label: string;
  accent?: 'green' | 'purple' | 'amber' | 'red' | 'blue';
}

interface ToolbarGroup {
  id: string;
  items: ToolbarItem[];
  designerOnly?: boolean;
}

const POLL_NORMAL = 5000;
const POLL_TURBO = 1000;
const TURBO_DURATION = 2 * 60 * 1000; // 2 perc

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  readonly context = signal<OverlayContext>({ mode: 'normal' });
  readonly activeDoc = signal<ActiveDocInfo>({ name: null, path: null, dir: null });
  readonly isDesignerMode = computed(() => this.context().mode === 'designer');
  readonly isTurbo = signal(false);

  /** Aktiv doc nev roviditve (max 25 karakter, kiterjesztes nelkul) */
  readonly activeDocLabel = computed(() => {
    const name = this.activeDoc().name;
    if (!name) return null;
    const base = name.replace(/\.(psd|psb|pdd)$/i, '');
    return base.length > 25 ? base.slice(0, 22) + '...' : base;
  });

  /** Kijelolt layerek szama */
  readonly selectedLayers = computed(() => this.activeDoc().selectedLayers ?? 0);

  private readonly allGroups: ToolbarGroup[] = [
    {
      id: 'align',
      designerOnly: true,
      items: [
        { id: 'align-left', icon: ICONS.ALIGN_START_V, label: 'Balra igazitas' },
        { id: 'align-center-h', icon: ICONS.ALIGN_CENTER_V, label: 'Vizszintes kozepre' },
        { id: 'align-right', icon: ICONS.ALIGN_END_V, label: 'Jobbra igazitas' },
        { id: 'align-top', icon: ICONS.ALIGN_START_H, label: 'Felulre igazitas' },
        { id: 'align-center-v', icon: ICONS.ALIGN_CENTER_H, label: 'Fuggoleges kozepre' },
        { id: 'align-bottom', icon: ICONS.ALIGN_END_H, label: 'Alulra igazitas' },
      ],
    },
    {
      id: 'distribute',
      designerOnly: true,
      items: [
        { id: 'distribute-h', icon: ICONS.ALIGN_H_DISTRIBUTE, label: 'Vizszintes elosztas' },
        { id: 'distribute-v', icon: ICONS.ALIGN_V_DISTRIBUTE, label: 'Fuggoleges elosztas' },
        { id: 'center-document', icon: ICONS.MOVE, label: 'Dokumentum kozepre' },
      ],
    },
    {
      id: 'sort',
      designerOnly: true,
      items: [
        { id: 'arrange-grid', icon: ICONS.LAYOUT_GRID, label: 'Racsba rendezes', accent: 'purple' },
        { id: 'sort-abc', icon: ICONS.ARROW_DOWN_AZ, label: 'ABC sorrend', accent: 'blue' },
        { id: 'sort-gender', icon: ICONS.USERS, label: 'Felvaltva fiu-lany' },
        { id: 'sort-custom', icon: ICONS.LIST_ORDERED, label: 'Egyedi sorrend' },
      ],
    },
    {
      id: 'layers',
      designerOnly: true,
      items: [
        { id: 'upload-photo', icon: ICONS.CAMERA, label: 'Foto feltoltese', accent: 'green' },
        { id: 'link-layers', icon: ICONS.LINK, label: 'Osszelinkelés' },
        { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Szétlinkelés' },
        { id: 'extra-names', icon: ICONS.FILE_TEXT, label: 'Extra nevek' },
      ],
    },
    {
      id: 'photoshop',
      items: [
        { id: 'sync-photos', icon: ICONS.IMAGE_DOWN, label: 'Fotok szinkronizalasa', accent: 'green' },
        { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazitasa', accent: 'purple' },
        { id: 'refresh', icon: ICONS.REFRESH, label: 'Frissites PS-bol' },
      ],
    },
    {
      id: 'generate',
      items: [
        { id: 'generate-sample', icon: ICONS.IMAGE, label: 'Minta generalasa', accent: 'amber' },
        { id: 'generate-final', icon: ICONS.CHECK_CIRCLE, label: 'Veglegesites', accent: 'green' },
      ],
    },
    {
      id: 'view',
      designerOnly: true,
      items: [
        { id: 'toggle-grid', icon: ICONS.GRID, label: 'Racs be/ki' },
        { id: 'snap-grid', icon: ICONS.WAND, label: 'Racsba igazit' },
        { id: 'save', icon: ICONS.SAVE, label: 'Mentes', accent: 'purple' },
      ],
    },
    {
      id: 'ps-quick',
      items: [
        { id: 'ps-launch', icon: ICONS.PLAY, label: 'Photoshop inditasa', accent: 'blue' },
        { id: 'open-project', icon: ICONS.FILE_PLUS, label: 'PSD megnyitasa' },
        { id: 'ps-open-workdir', icon: ICONS.FOLDER_OPEN, label: 'Munkamappa' },
      ],
    },
  ];

  readonly groups = computed(() => {
    const isDesigner = this.isDesignerMode();
    return this.allGroups.filter(g => {
      if (g.id === 'ps-quick') return !isDesigner;
      if (g.designerOnly) return isDesigner;
      return true;
    });
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private turboTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadContext();
    this.listenContextChanges();
    this.loadActiveDoc();
    this.listenActiveDocChanges();
    this.startPolling(POLL_NORMAL);
  }

  onCommand(commandId: string): void {
    if (commandId === 'link-layers') {
      this.runLinkUnlink('actions/link-selected.jsx');
      return;
    }
    if (commandId === 'unlink-layers') {
      this.runLinkUnlink('actions/unlink-selected.jsx');
      return;
    }
    window.electronAPI?.overlay.executeCommand(commandId);
  }

  private async runLinkUnlink(scriptName: string): Promise<void> {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.photoshop.runJsx({ scriptName });
      // Azonnali poll a valtozas megjelenithesehez
      this.pollActiveDoc();
    } catch { /* ignore */ }
  }

  hide(): void {
    window.electronAPI?.overlay.hide();
  }

  /** Aktiv doc mappajaank megnyitasa Finder-ben */
  openActiveDocDir(): void {
    this.onCommand('ps-open-workdir');
  }

  /** Turbo mod: 1mp polling 2 percig, utana visszaall 5mp-re */
  toggleTurbo(): void {
    if (this.isTurbo()) {
      this.stopTurbo();
    } else {
      this.isTurbo.set(true);
      this.restartPolling(POLL_TURBO);
      this.turboTimeout = setTimeout(() => this.stopTurbo(), TURBO_DURATION);
    }
  }

  private stopTurbo(): void {
    this.isTurbo.set(false);
    if (this.turboTimeout) {
      clearTimeout(this.turboTimeout);
      this.turboTimeout = null;
    }
    this.restartPolling(POLL_NORMAL);
  }

  private restartPolling(interval: number): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => this.pollActiveDoc(), interval);
  }

  private async loadContext(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const ctx = await window.electronAPI.overlay.getContext();
      this.ngZone.run(() => this.context.set(ctx));
    } catch { /* default: normal */ }
  }

  private listenContextChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onContextChanged((ctx) => {
      this.ngZone.run(() => this.context.set(ctx));
    });
    this.destroyRef.onDestroy(cleanup);
  }

  private async loadActiveDoc(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const doc = await window.electronAPI.overlay.getActiveDoc();
      this.ngZone.run(() => this.mergeActiveDoc(doc));
    } catch { /* ignore */ }
  }

  private listenActiveDocChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onActiveDocChanged((doc) => {
      this.ngZone.run(() => this.mergeActiveDoc(doc));
    });
    this.destroyRef.onDestroy(cleanup);
  }

  /** IPC-bol jovo doc info merge — megőrzi a selectedLayers-t ha az IPC nem kuldi */
  private mergeActiveDoc(doc: ActiveDocInfo): void {
    const current = this.activeDoc();
    this.activeDoc.set({
      ...doc,
      selectedLayers: doc.selectedLayers ?? current.selectedLayers,
    });
  }

  private startPolling(interval: number): void {
    if (!window.electronAPI) return;
    this.pollActiveDoc();
    this.pollTimer = setInterval(() => this.pollActiveDoc(), interval);
    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
      if (this.turboTimeout) clearTimeout(this.turboTimeout);
    });
  }

  private async pollActiveDoc(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName: 'actions/get-active-doc.jsx' });
      if (result.success && result.output) {
        const cleaned = result.output.trim();
        if (cleaned.startsWith('{')) {
          const doc: ActiveDocInfo = JSON.parse(cleaned);
          this.ngZone.run(() => this.activeDoc.set(doc));
          window.electronAPI.overlay.setActiveDoc(doc);
        }
      }
    } catch { /* PS nem elerheto — skip */ }
  }
}
