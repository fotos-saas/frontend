import {
  Component, ChangeDetectionStrategy, signal, output, computed,
  HostListener,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';

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
}

/**
 * Floating Command Overlay — Claude Desktop-stílusú lebegő panel.
 * Dupla Ctrl-lel aktiválódik, always-on-top.
 * Minden tabló-szerkesztő funkció elérhető egy helyen.
 */
@Component({
  selector: 'app-layout-command-overlay',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    @if (visible()) {
      <div class="overlay-backdrop" (click)="close()"></div>
      <div
        class="overlay"
        [class.overlay--expanded]="expanded()"
        [class.overlay--minimized]="minimized()"
      >
        <!-- Drag handle + Header -->
        <div class="overlay__header">
          <div class="overlay__drag">
            <lucide-icon [name]="ICONS.GRIP" [size]="14" />
          </div>
          <div class="overlay__title">
            <lucide-icon [name]="ICONS.COMMAND" [size]="14" />
            <span>Parancsok</span>
          </div>
          <div class="overlay__header-actions">
            <button class="overlay__header-btn"
              (click)="expanded.set(!expanded())"
              [matTooltip]="expanded() ? 'Kompakt nézet' : 'Kibontott nézet'">
              <lucide-icon [name]="expanded() ? ICONS.MINIMIZE_2 : ICONS.EXPAND" [size]="13" />
            </button>
            <button class="overlay__header-btn overlay__header-btn--close"
              (click)="close()" matTooltip="Bezárás (Esc)">
              <lucide-icon [name]="ICONS.X" [size]="14" />
            </button>
          </div>
        </div>

        <!-- Gyorskeresés -->
        <div class="overlay__search">
          <lucide-icon [name]="ICONS.SEARCH" [size]="14" class="overlay__search-icon" />
          <input
            class="overlay__search-input"
            placeholder="Keresés parancsok között..."
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
            #searchInput
          />
          @if (searchQuery()) {
            <button class="overlay__search-clear" (click)="searchQuery.set('')">
              <lucide-icon [name]="ICONS.X" [size]="12" />
            </button>
          }
        </div>

        <!-- Parancs szekciók -->
        <div class="overlay__body">
          @for (section of filteredSections(); track section.id) {
            <div class="overlay__section">
              <div class="overlay__section-header">
                <lucide-icon [name]="section.icon" [size]="12" />
                <span>{{ section.label }}</span>
              </div>
              <div class="overlay__section-items">
                @for (item of section.items; track item.id) {
                  <button
                    class="cmd-btn"
                    [class.cmd-btn--green]="item.accent === 'green'"
                    [class.cmd-btn--purple]="item.accent === 'purple'"
                    [class.cmd-btn--amber]="item.accent === 'amber'"
                    [class.cmd-btn--red]="item.accent === 'red'"
                    [class.cmd-btn--blue]="item.accent === 'blue'"
                    (click)="onCommand(item.id)"
                    [matTooltip]="item.label"
                    matTooltipPosition="right"
                  >
                    <lucide-icon [name]="item.icon" [size]="16" class="cmd-btn__icon" />
                    @if (expanded()) {
                      <span class="cmd-btn__label">{{ item.label }}</span>
                      @if (item.shortcut) {
                        <kbd class="cmd-btn__kbd">{{ item.shortcut }}</kbd>
                      }
                      @if (item.badge) {
                        <span class="cmd-btn__badge"
                          [class.cmd-btn__badge--green]="item.accent === 'green'"
                          [class.cmd-btn__badge--amber]="item.accent === 'amber'"
                        >{{ item.badge }}</span>
                      }
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (filteredSections().length === 0) {
            <div class="overlay__empty">
              <lucide-icon [name]="ICONS.SEARCH" [size]="24" />
              <span>Nincs találat</span>
            </div>
          }
        </div>

        <!-- Footer: PS státusz -->
        <div class="overlay__footer">
          <div class="overlay__ps-status overlay__ps-status--connected">
            <span class="overlay__ps-dot"></span>
            <span>Photoshop csatlakozva</span>
          </div>
          <kbd class="overlay__shortcut-hint">Ctrl Ctrl</kbd>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ===== BACKDROP ===== */
    .overlay-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
    }

    /* ===== OVERLAY PANEL ===== */
    .overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      max-height: 580px;
      background: #16162e;
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: 16px;
      box-shadow:
        0 0 0 1px rgba(124, 58, 237, 0.08),
        0 24px 80px rgba(0, 0, 0, 0.65),
        0 0 120px rgba(124, 58, 237, 0.08);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: overlayIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      -webkit-font-smoothing: antialiased;
    }

    .overlay--expanded {
      width: 380px;
      max-height: 640px;
    }

    @keyframes overlayIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.92);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .overlay { animation: none; }
    }

    /* ===== HEADER ===== */
    .overlay__header {
      display: flex;
      align-items: center;
      height: 44px;
      padding: 0 6px 0 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
      -webkit-app-region: drag;
    }

    .overlay__drag {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      color: rgba(255, 255, 255, 0.15);
      cursor: grab;
      flex-shrink: 0;
      transition: color 0.15s;

      &:hover { color: rgba(255, 255, 255, 0.35); }
      &:active { cursor: grabbing; }
    }

    .overlay__title {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      font-size: 0.78rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.01em;
      -webkit-app-region: no-drag;

      lucide-icon { color: #a78bfa; }
    }

    .overlay__header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      -webkit-app-region: no-drag;
    }

    .overlay__header-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 7px;
      background: transparent;
      color: rgba(255, 255, 255, 0.35);
      cursor: pointer;
      transition: all 0.12s;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
      }

      &--close:hover {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
      }
    }

    /* ===== KERESÉS ===== */
    .overlay__search {
      display: flex;
      align-items: center;
      margin: 8px 10px 4px;
      padding: 0 10px;
      height: 36px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      transition: border-color 0.15s;

      &:focus-within {
        border-color: rgba(167, 139, 250, 0.4);
        background: rgba(255, 255, 255, 0.06);
      }
    }

    .overlay__search-icon {
      color: rgba(255, 255, 255, 0.25);
      flex-shrink: 0;
    }

    .overlay__search-input {
      flex: 1;
      height: 100%;
      border: none;
      background: transparent;
      color: #ffffff;
      font-size: 0.8rem;
      padding: 0 8px;
      outline: none;
      font-family: inherit;

      &::placeholder {
        color: rgba(255, 255, 255, 0.25);
      }
    }

    .overlay__search-clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.1s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.7);
      }
    }

    /* ===== BODY (scroll) ===== */
    .overlay__body {
      flex: 1;
      overflow-y: auto;
      padding: 6px 8px 8px;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
    }

    /* ===== SZEKCIÓK ===== */
    .overlay__section {
      margin-bottom: 2px;
    }

    .overlay__section-header {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 8px 8px 5px;
      font-size: 0.65rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.08em;

      lucide-icon { opacity: 0.6; }
    }

    .overlay__section-items {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    /* ===== PARANCS GOMBOK ===== */
    .cmd-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      border-radius: 9px;
      background: transparent;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.1s ease;
      text-align: left;
      position: relative;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #ffffff;
      }

      &:active {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(0.99);
      }
    }

    .cmd-btn__icon {
      flex-shrink: 0;
      color: rgba(255, 255, 255, 0.45);
      transition: color 0.1s;
    }

    .cmd-btn:hover .cmd-btn__icon {
      color: rgba(255, 255, 255, 0.8);
    }

    /* Accent színek */
    .cmd-btn--green {
      .cmd-btn__icon { color: #34d399; }
      &:hover {
        background: rgba(52, 211, 153, 0.1);
        .cmd-btn__icon { color: #6ee7b7; }
      }
    }

    .cmd-btn--purple {
      .cmd-btn__icon { color: #a78bfa; }
      &:hover {
        background: rgba(167, 139, 250, 0.1);
        .cmd-btn__icon { color: #c4b5fd; }
      }
    }

    .cmd-btn--amber {
      .cmd-btn__icon { color: #fbbf24; }
      &:hover {
        background: rgba(251, 191, 36, 0.1);
        .cmd-btn__icon { color: #fcd34d; }
      }
    }

    .cmd-btn--red {
      .cmd-btn__icon { color: #f87171; }
      &:hover {
        background: rgba(248, 113, 113, 0.1);
        .cmd-btn__icon { color: #fca5a5; }
      }
    }

    .cmd-btn--blue {
      .cmd-btn__icon { color: #60a5fa; }
      &:hover {
        background: rgba(96, 165, 250, 0.1);
        .cmd-btn__icon { color: #93c5fd; }
      }
    }

    .cmd-btn__label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cmd-btn__kbd {
      font-size: 0.6rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 1px 5px;
      font-family: inherit;
      letter-spacing: 0.02em;
      flex-shrink: 0;
    }

    .cmd-btn__badge {
      font-size: 0.6rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 2px 6px;
      flex-shrink: 0;

      &--green {
        color: #34d399;
        background: rgba(52, 211, 153, 0.15);
      }

      &--amber {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.12);
      }
    }

    /* ===== ÜRES ÁLLAPOT ===== */
    .overlay__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 0;
      color: rgba(255, 255, 255, 0.2);
      font-size: 0.8rem;
    }

    /* ===== FOOTER ===== */
    .overlay__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 36px;
      padding: 0 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }

    .overlay__ps-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.35);

      &--connected {
        color: rgba(52, 211, 153, 0.7);
      }

      &--disconnected {
        color: rgba(248, 113, 113, 0.7);
      }
    }

    .overlay__ps-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px rgba(52, 211, 153, 0.5);
      animation: dotPulse 2s ease-in-out infinite;
    }

    @keyframes dotPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .overlay__shortcut-hint {
      font-size: 0.6rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 5px;
      padding: 2px 7px;
      font-family: inherit;
      letter-spacing: 0.03em;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutCommandOverlayComponent {
  protected readonly ICONS = ICONS;

  readonly visible = signal(false);
  readonly expanded = signal(true);
  readonly minimized = signal(false);
  readonly searchQuery = signal('');

  readonly commandExecuted = output<string>();

  /** Összes szekció definíció */
  readonly sections = signal<CommandSection[]>([
    {
      id: 'photoshop',
      icon: ICONS.MONITOR,
      label: 'Photoshop',
      items: [
        { id: 'sync-photos', icon: ICONS.IMAGE_DOWN, label: 'Fotók szinkronizálása', shortcut: '⌘⇧S', accent: 'green' },
        { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazítása', shortcut: '⌘⇧N', accent: 'purple' },
        { id: 'relocate-layout', icon: ICONS.LAYOUT_GRID, label: 'Elrendezés szinkronizálása', accent: 'blue' },
        { id: 'update-positions', icon: ICONS.TAG, label: 'Pozíciók frissítése', shortcut: '⌘⇧P', accent: 'amber' },
        { id: 'open-project', icon: ICONS.FILE_PLUS, label: 'PSD megnyitása', shortcut: '⌘O' },
        { id: 'open-workdir', icon: ICONS.FOLDER_OPEN, label: 'Munkamappa megnyitása' },
        { id: 'refresh', icon: ICONS.REFRESH, label: 'Frissítés PS-ből', shortcut: '⌘R' },
      ],
    },
    {
      id: 'sort',
      icon: ICONS.ARROW_DOWN_AZ,
      label: 'Rendezés',
      items: [
        { id: 'sort-abc', icon: ICONS.ARROW_DOWN_AZ, label: 'ABC sorrend', accent: 'blue' },
        { id: 'sort-gender', icon: ICONS.USERS, label: 'Felváltva fiú-lány', accent: 'purple' },
        { id: 'sort-custom', icon: ICONS.LIST_ORDERED, label: 'Egyedi sorrend' },
        { id: 'arrange-grid', icon: ICONS.LAYOUT_GRID, label: 'Rácsba rendezés' },
      ],
    },
    {
      id: 'align',
      icon: ICONS.ALIGN_CENTER_V,
      label: 'Igazítás',
      items: [
        { id: 'align-left', icon: ICONS.ALIGN_START_V, label: 'Balra igazítás' },
        { id: 'align-center-h', icon: ICONS.ALIGN_CENTER_V, label: 'Vízszintes középre' },
        { id: 'align-right', icon: ICONS.ALIGN_END_V, label: 'Jobbra igazítás' },
        { id: 'align-top', icon: ICONS.ALIGN_START_H, label: 'Felülre igazítás' },
        { id: 'align-center-v', icon: ICONS.ALIGN_CENTER_H, label: 'Függőleges középre' },
        { id: 'align-bottom', icon: ICONS.ALIGN_END_H, label: 'Alulra igazítás' },
        { id: 'distribute-h', icon: ICONS.ALIGN_H_DISTRIBUTE, label: 'Vízszintes elosztás' },
        { id: 'distribute-v', icon: ICONS.ALIGN_V_DISTRIBUTE, label: 'Függőleges elosztás' },
        { id: 'center-document', icon: ICONS.MOVE, label: 'Dokumentum középre' },
      ],
    },
    {
      id: 'generate',
      icon: ICONS.ZAPS,
      label: 'Generálás',
      items: [
        { id: 'generate-sample', icon: ICONS.IMAGE, label: 'Minta generálása', shortcut: '⌘M', accent: 'amber', badge: 'HD' },
        { id: 'generate-final', icon: ICONS.CHECK_CIRCLE, label: 'Véglegesítés', shortcut: '⌘⇧F', accent: 'green', badge: 'F+K' },
      ],
    },
    {
      id: 'layers',
      icon: ICONS.LAYERS,
      label: 'Layerek',
      items: [
        { id: 'upload-photo', icon: ICONS.CAMERA, label: 'Fotó feltöltése', accent: 'green' },
        { id: 'link-layers', icon: ICONS.LINK, label: 'Layerek összelinkelése' },
        { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Linkelés megszüntetése' },
        { id: 'extra-names', icon: ICONS.FILE_TEXT, label: 'Extra nevek szerkesztése' },
      ],
    },
    {
      id: 'view',
      icon: ICONS.GRID,
      label: 'Nézet',
      items: [
        { id: 'toggle-grid', icon: ICONS.GRID, label: 'Rács be/ki', shortcut: 'G' },
        { id: 'snap-grid', icon: ICONS.WAND, label: 'Rácsba igazít' },
        { id: 'save', icon: ICONS.SAVE, label: 'Mentés', shortcut: '⌘S', accent: 'purple' },
      ],
    },
    {
      id: 'batch',
      icon: ICONS.SPARKLES,
      label: 'Batch műveletek',
      items: [
        { id: 'batch-actions', icon: ICONS.WAND, label: 'Akciók megnyitása', accent: 'amber' },
        { id: 'bulk-photos', icon: ICONS.IMAGES, label: 'Tömeges fotó feltöltés' },
      ],
    },
  ]);

  /** Szűrt szekciók a keresés alapján */
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

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.visible()) {
      this.close();
    }
  }

  open(): void {
    this.visible.set(true);
    this.searchQuery.set('');
  }

  close(): void {
    this.visible.set(false);
  }

  toggle(): void {
    if (this.visible()) {
      this.close();
    } else {
      this.open();
    }
  }

  onCommand(commandId: string): void {
    this.commandExecuted.emit(commandId);
  }
}
