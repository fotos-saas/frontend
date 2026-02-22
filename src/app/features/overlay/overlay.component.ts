import {
  Component, ChangeDetectionStrategy, signal, computed,
  HostListener, OnInit, DestroyRef, inject, NgZone,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayContext } from '../../core/services/electron.types';

interface CommandItem {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  accent?: 'green' | 'purple' | 'amber' | 'red' | 'blue';
  badge?: string;
}

interface CommandSection {
  id: string;
  icon: string;
  label: string;
  items: CommandItem[];
  /** Csak designer modban jelenik meg */
  designerOnly?: boolean;
}

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  readonly searchQuery = signal('');
  readonly context = signal<OverlayContext>({ mode: 'normal' });

  readonly isDesignerMode = computed(() => this.context().mode === 'designer');

  /** Osszes szekciok */
  private readonly allSections: CommandSection[] = [
    // === DESIGNER MODBAN ELERHETO ===
    {
      id: 'photoshop',
      icon: ICONS.MONITOR,
      label: 'Photoshop',
      items: [
        { id: 'sync-photos', icon: ICONS.IMAGE_DOWN, label: 'Fotok szinkronizalasa', shortcut: '\u2318\u21E7S', accent: 'green' },
        { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazitasa', shortcut: '\u2318\u21E7N', accent: 'purple' },
        { id: 'open-project', icon: ICONS.FILE_PLUS, label: 'PSD megnyitasa', shortcut: '\u2318O' },
        { id: 'open-workdir', icon: ICONS.FOLDER_OPEN, label: 'Munkamappa megnyitasa' },
        { id: 'refresh', icon: ICONS.REFRESH, label: 'Frissites PS-bol', shortcut: '\u2318R' },
      ],
    },
    {
      id: 'sort',
      icon: ICONS.ARROW_DOWN_AZ,
      label: 'Rendezes',
      designerOnly: true,
      items: [
        { id: 'sort-abc', icon: ICONS.ARROW_DOWN_AZ, label: 'ABC sorrend', accent: 'blue' },
        { id: 'sort-gender', icon: ICONS.USERS, label: 'Felvaltva fiu-lany', accent: 'purple' },
        { id: 'sort-custom', icon: ICONS.LIST_ORDERED, label: 'Egyedi sorrend' },
        { id: 'arrange-grid', icon: ICONS.LAYOUT_GRID, label: 'Racsba rendezes' },
      ],
    },
    {
      id: 'align',
      icon: ICONS.ALIGN_CENTER_V,
      label: 'Igazitas',
      designerOnly: true,
      items: [
        { id: 'align-left', icon: ICONS.ALIGN_START_V, label: 'Balra igazitas' },
        { id: 'align-center-h', icon: ICONS.ALIGN_CENTER_V, label: 'Vizszintes kozepre' },
        { id: 'align-right', icon: ICONS.ALIGN_END_V, label: 'Jobbra igazitas' },
        { id: 'align-top', icon: ICONS.ALIGN_START_H, label: 'Felulre igazitas' },
        { id: 'align-center-v', icon: ICONS.ALIGN_CENTER_H, label: 'Fuggoleges kozepre' },
        { id: 'align-bottom', icon: ICONS.ALIGN_END_H, label: 'Alulra igazitas' },
        { id: 'distribute-h', icon: ICONS.ALIGN_H_DISTRIBUTE, label: 'Vizszintes elosztas' },
        { id: 'distribute-v', icon: ICONS.ALIGN_V_DISTRIBUTE, label: 'Fuggoleges elosztas' },
        { id: 'center-document', icon: ICONS.MOVE, label: 'Dokumentum kozepre' },
      ],
    },
    {
      id: 'generate',
      icon: ICONS.ZAPS,
      label: 'Generalas',
      items: [
        { id: 'generate-sample', icon: ICONS.IMAGE, label: 'Minta generalasa', shortcut: '\u2318M', accent: 'amber', badge: 'HD' },
        { id: 'generate-final', icon: ICONS.CHECK_CIRCLE, label: 'Veglegesites', shortcut: '\u2318\u21E7F', accent: 'green', badge: 'F+K' },
      ],
    },
    {
      id: 'layers',
      icon: ICONS.LAYERS,
      label: 'Layerek',
      designerOnly: true,
      items: [
        { id: 'upload-photo', icon: ICONS.CAMERA, label: 'Foto feltoltese', accent: 'green' },
        { id: 'link-layers', icon: ICONS.LINK, label: 'Layerek osszelinkelese' },
        { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Linkeles megszuntetese' },
        { id: 'extra-names', icon: ICONS.FILE_TEXT, label: 'Extra nevek szerkesztese' },
      ],
    },
    {
      id: 'view',
      icon: ICONS.GRID,
      label: 'Nezet',
      designerOnly: true,
      items: [
        { id: 'toggle-grid', icon: ICONS.GRID, label: 'Racs be/ki', shortcut: 'G' },
        { id: 'snap-grid', icon: ICONS.WAND, label: 'Racsba igazit' },
        { id: 'save', icon: ICONS.SAVE, label: 'Mentes', shortcut: '\u2318S', accent: 'purple' },
      ],
    },
    {
      id: 'batch',
      icon: ICONS.SPARKLES,
      label: 'Batch muveletek',
      designerOnly: true,
      items: [
        { id: 'batch-actions', icon: ICONS.WAND, label: 'Akciok megnyitasa', accent: 'amber' },
        { id: 'bulk-photos', icon: ICONS.IMAGES, label: 'Tomeges foto feltoltes' },
      ],
    },
    // === NORMAL MOD — PS muveletek + gyorselerest ===
    {
      id: 'ps-quick',
      icon: ICONS.MONITOR,
      label: 'Gyors muveletek',
      items: [
        { id: 'ps-launch', icon: ICONS.PLAY, label: 'Photoshop inditasa', accent: 'blue' },
        { id: 'ps-open-workdir', icon: ICONS.FOLDER_OPEN, label: 'Munkamappa' },
      ],
    },
  ];

  /** Kontextus-fuggo szekciok */
  readonly sections = computed(() => {
    const isDesigner = this.isDesignerMode();
    return this.allSections.filter(section => {
      // ps-quick csak normal modban
      if (section.id === 'ps-quick') return !isDesigner;
      // designerOnly szekciok csak designer modban
      if (section.designerOnly) return isDesigner;
      // photoshop + generate mindket modban latszik
      return true;
    });
  });

  /** Szurt szekciok a kereses alapjan */
  readonly filteredSections = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.sections();
    return this.sections()
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.items.length > 0);
  });

  ngOnInit(): void {
    this.loadContext();
    this.listenContextChanges();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.hide();
  }

  onCommand(commandId: string): void {
    window.electronAPI?.overlay.executeCommand(commandId);
    // Auto-hide parancs utan
    this.hide();
  }

  hide(): void {
    window.electronAPI?.overlay.hide();
  }

  private async loadContext(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const ctx = await window.electronAPI.overlay.getContext();
      this.ngZone.run(() => this.context.set(ctx));
    } catch {
      // Silently fail — default: normal mode
    }
  }

  private listenContextChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onContextChanged((ctx) => {
      this.ngZone.run(() => this.context.set(ctx));
    });
    this.destroyRef.onDestroy(cleanup);
  }
}
