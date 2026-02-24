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
  tooltip?: string;
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
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class OverlayComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  readonly context = signal<OverlayContext>({ mode: 'normal' });
  readonly activeDoc = signal<ActiveDocInfo>({ name: null, path: null, dir: null });
  readonly isDesignerMode = computed(() => this.context().mode === 'designer');
  readonly isTurbo = signal(false);
  readonly busyCommand = signal<string | null>(null);
  readonly openSubmenu = signal<string | null>(null);
  private collapseTimer: ReturnType<typeof setTimeout> | null = null;

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
        { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazitasa', tooltip: 'Nevek a kepek ala (kijelolt kepeknel csak azokat, egyebkent mindet). Unlinkeli a parokat.', accent: 'purple' },
        { id: 'link-layers', icon: ICONS.LINK, label: 'Osszelinkelés', tooltip: 'Kijelolt layerek osszelinkelese az azonos nevu tarsaikkal' },
        { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Szétlinkelés', tooltip: 'Kijelolt layerek linkelesenek megszuntetese' },
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
    document.body.classList.add('overlay-mode');
    this.loadContext();
    this.listenContextChanges();
    this.loadActiveDoc();
    this.listenActiveDocChanges();
    this.startPolling(POLL_NORMAL);
    this.setupClickThrough();
  }

  private static readonly ALIGN_MAP: Record<string, string> = {
    'align-left': 'left',
    'align-center-h': 'centerH',
    'align-right': 'right',
    'align-top': 'top',
    'align-center-v': 'centerV',
    'align-bottom': 'bottom',
  };

  /** Submenu-s gombok: kattintasra inline collapse nyilik */
  private static readonly SUBMENU_IDS = new Set(['arrange-names', 'sync-photos']);

  /** Keret toggle szinkronizáláshoz (projekt szinten mentve) */
  readonly syncWithBorder = signal(this.loadSyncBorder());

  onCommand(commandId: string): void {
    // Submenu-s gomb → inline collapse toggle
    if (OverlayComponent.SUBMENU_IDS.has(commandId)) {
      const isOpen = this.openSubmenu() === commandId;
      this.openSubmenu.set(isOpen ? null : commandId);
      this.resetCollapseTimer(isOpen ? null : commandId);
      return;
    }
    this.closeSubmenu();

    // Photo upload — kozvetlenul megnyitja a floating ablakot
    if (commandId === 'upload-photo') {
      const projectId = this.context().projectId;
      if (projectId) {
        window.electronAPI?.overlay.openPhotoUpload(projectId);
      }
      return;
    }

    if (commandId === 'link-layers') {
      this.runJsxAction(commandId, 'actions/link-selected.jsx');
      return;
    }
    if (commandId === 'unlink-layers') {
      this.runJsxAction(commandId, 'actions/unlink-selected.jsx');
      return;
    }
    const alignType = OverlayComponent.ALIGN_MAP[commandId];
    if (alignType) {
      this.runJsxAction(commandId, 'actions/align-linked.jsx', { ALIGN_TYPE: alignType });
      return;
    }
    window.electronAPI?.overlay.executeCommand(commandId);
  }

  /** Submenu bezarasa ha a toolbar-on kivulre kattintanak */
  onDocumentClick(event: MouseEvent): void {
    if (!this.openSubmenu()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.toolbar')) {
      this.closeSubmenu();
    }
  }

  /** Nevek igazitasa a valasztott align-nal */
  arrangeNames(textAlign: string): void {
    this.closeSubmenu();
    this.runJsxAction('arrange-names', 'actions/arrange-names-selected.jsx', { TEXT_ALIGN: textAlign });
  }

  /** Fotó szinkronizálás — mind vagy csak hiányzó */
  syncPhotos(mode: 'all' | 'missing'): void {
    this.closeSubmenu();
    const commandId = mode === 'missing' ? 'sync-photos-missing' : 'sync-photos';
    window.electronAPI?.overlay.executeCommand(commandId);
  }

  /** Keret toggle */
  toggleSyncBorder(): void {
    this.syncWithBorder.update(v => !v);
    this.saveSyncBorder(this.syncWithBorder());
    window.electronAPI?.overlay.executeCommand(
      this.syncWithBorder() ? 'sync-border-on' : 'sync-border-off',
    );
  }

  private syncBorderKey(): string {
    const projectId = this.context().projectId ?? 'default';
    return `sync-border-${projectId}`;
  }

  private loadSyncBorder(): boolean {
    return this.loadSyncBorderForProject(this.context().projectId);
  }

  private loadSyncBorderForProject(projectId?: number): boolean {
    try {
      const key = `sync-border-${projectId ?? 'default'}`;
      return localStorage.getItem(key) !== 'false';
    } catch {
      return true;
    }
  }

  private saveSyncBorder(value: boolean): void {
    try {
      localStorage.setItem(this.syncBorderKey(), String(value));
    } catch { /* ignore */ }
  }

  /** Click-through: atlatszo terulet atenged kattintast a mogotte levo appnak */
  private setupClickThrough(): void {
    if (!window.electronAPI) return;
    document.addEventListener('mousemove', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ha a body/html-re mutat (atlatszo terulet) → atenged
      if (target === document.documentElement || target === document.body) {
        window.electronAPI!.overlay.setIgnoreMouseEvents(true);
      }
    });
    // Minden lathato elem mouseenter-jere visszakapcsol
    document.addEventListener('mouseenter', () => {
      window.electronAPI!.overlay.setIgnoreMouseEvents(false);
    }, true);
  }

  /** Collapse hover: egér rajta → timer törlés */
  onCollapseEnter(): void {
    this.clearCollapseTimer();
  }

  /** Collapse hover vége: timer újraindítás */
  onCollapseLeave(): void {
    if (this.openSubmenu()) {
      this.resetCollapseTimer(this.openSubmenu());
    }
  }

  private closeSubmenu(): void {
    if (this.openSubmenu()) {
      this.openSubmenu.set(null);
      this.clearCollapseTimer();
    }
  }

  private resetCollapseTimer(submenuId: string | null): void {
    this.clearCollapseTimer();
    if (submenuId) {
      this.collapseTimer = setTimeout(() => {
        this.ngZone.run(() => this.closeSubmenu());
      }, 5000);
    }
  }

  private clearCollapseTimer(): void {
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  private async runJsxAction(commandId: string, scriptName: string, jsonData?: Record<string, unknown>): Promise<void> {
    if (!window.electronAPI) return;
    this.busyCommand.set(commandId);
    try {
      await window.electronAPI.photoshop.runJsx({ scriptName, jsonData });
      this.pollActiveDoc();
    } catch { /* ignore */ }
    this.ngZone.run(() => this.busyCommand.set(null));
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
      this.ngZone.run(() => {
        this.context.set(ctx);
        this.syncWithBorder.set(this.loadSyncBorderForProject(ctx.projectId));
      });
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
