import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';
import { LayoutDesignerGridService } from '../../layout-designer-grid.service';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

/**
 * Layout Toolbar — eszköztár a vizuális szerkesztő tetején.
 * Dokumentum info, grid toggle, igazítás gombok, mentés + bezárás.
 */
@Component({
  selector: 'app-layout-toolbar',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="layout-toolbar">
      <!-- Bal: dokumentum info + grid + igazítás -->
      <div class="layout-toolbar__left">
        @if (state.documentSizeCm(); as size) {
          <span class="layout-toolbar__doc-info">
            {{ size.widthCm }} &times; {{ size.heightCm }} cm
          </span>
        }

        <div class="layout-toolbar__separator"></div>

        <button
          class="toolbar-btn toolbar-btn--grid"
          [class.toolbar-btn--active]="gridService.gridEnabled()"
          (click)="gridService.cycleGridMode()"
          matTooltip="Rács mód: {{ gridService.gridModeLabel() }}"
        >
          <lucide-icon [name]="ICONS.GRID" [size]="16" />
          @if (gridService.gridEnabled()) {
            <span class="toolbar-btn__label">{{ gridService.gridModeLabel() }}</span>
          }
        </button>

        <button
          class="toolbar-btn"
          [disabled]="!gridService.gridEnabled()"
          (click)="gridService.snapAllToGrid()"
          matTooltip="Mindenkit rácsba igazít"
        >
          <lucide-icon [name]="ICONS.WAND" [size]="16" />
        </button>

        <div class="layout-toolbar__separator"></div>

        <button
          class="toolbar-btn"
          [disabled]="!state.canUndo()"
          (click)="state.undo()"
          matTooltip="Visszavonás (⌘Z)"
        >
          <lucide-icon [name]="ICONS.UNDO" [size]="16" />
        </button>
        <button
          class="toolbar-btn"
          [disabled]="!state.canRedo()"
          (click)="state.redo()"
          matTooltip="Újra (⌘⇧Z)"
        >
          <lucide-icon [name]="ICONS.REDO" [size]="16" />
        </button>

        @if (state.hasSelection()) {
          <div class="layout-toolbar__separator"></div>

          <span class="layout-toolbar__selection">
            {{ state.selectionCount() }} kijelölve
          </span>

          <!-- Igazítás: bal/közép/jobb -->
          <button class="toolbar-btn" [disabled]="state.selectionCount() < 2"
            (click)="actions.alignLeft()" matTooltip="Balra igazítás">
            <lucide-icon [name]="ICONS.ALIGN_START_V" [size]="16" />
          </button>
          <button class="toolbar-btn" [disabled]="state.selectionCount() < 2"
            (click)="actions.alignCenterHorizontal()" matTooltip="Vízszintes középre">
            <lucide-icon [name]="ICONS.ALIGN_CENTER_V" [size]="16" />
          </button>
          <button class="toolbar-btn" [disabled]="state.selectionCount() < 2"
            (click)="actions.alignRight()" matTooltip="Jobbra igazítás">
            <lucide-icon [name]="ICONS.ALIGN_END_V" [size]="16" />
          </button>

          <div class="layout-toolbar__divider"></div>

          <!-- Igazítás: fent/közép/lent -->
          <button class="toolbar-btn" [disabled]="state.selectionCount() < 2"
            (click)="actions.alignTop()" matTooltip="Tetejére igazítás">
            <lucide-icon [name]="ICONS.ALIGN_START_H" [size]="16" />
          </button>
          <button class="toolbar-btn" [disabled]="state.selectionCount() < 2"
            (click)="actions.alignCenterVertical()" matTooltip="Függőleges középre">
            <lucide-icon [name]="ICONS.ALIGN_CENTER_H" [size]="16" />
          </button>
          <button class="toolbar-btn" [disabled]="state.selectionCount() < 2"
            (click)="actions.alignBottom()" matTooltip="Aljára igazítás">
            <lucide-icon [name]="ICONS.ALIGN_END_H" [size]="16" />
          </button>

          <div class="layout-toolbar__divider"></div>

          <button class="toolbar-btn"
            [disabled]="state.selectionCount() < 2"
            [class.toolbar-btn--active]="sortService.panelOpen()"
            (click)="sortService.panelOpen.update(v => !v)"
            matTooltip="Rendezés panel">
            <lucide-icon [name]="ICONS.ARROW_DOWN_AZ" [size]="16" />
          </button>

        }
      </div>

      <!-- Dropdown: elosztás + sorok/oszlopok/rács (toolbar szintjén, overflow miatt) -->
      @if (state.hasSelection()) {
        <div class="toolbar-dropdown">
          <button class="toolbar-btn" (click)="moreOpen.set(!moreOpen())"
            matTooltip="Elosztás és rendezés">
            <lucide-icon [name]="ICONS.LAYOUT_GRID" [size]="16" />
            <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="12" />
          </button>
          @if (moreOpen()) {
            <div class="toolbar-dropdown__panel" (click)="moreOpen.set(false)">
              <button class="toolbar-dropdown__item"
                [disabled]="state.selectionCount() < 3"
                (click)="actions.distributeHorizontal()">
                <lucide-icon [name]="ICONS.ALIGN_H_DISTRIBUTE" [size]="16" />
                Vízszintes elosztás
              </button>
              <button class="toolbar-dropdown__item"
                [disabled]="state.selectionCount() < 3"
                (click)="actions.distributeVertical()">
                <lucide-icon [name]="ICONS.ALIGN_V_DISTRIBUTE" [size]="16" />
                Függőleges elosztás
              </button>
              <div class="toolbar-dropdown__sep"></div>
              <button class="toolbar-dropdown__item"
                [disabled]="state.selectionCount() < 2"
                (click)="actions.alignRows()">
                <lucide-icon [name]="ICONS.ROWS_3" [size]="16" />
                Sorok igazítása
              </button>
              <button class="toolbar-dropdown__item"
                [disabled]="state.selectionCount() < 2"
                (click)="actions.alignColumns()">
                <lucide-icon [name]="ICONS.COLUMNS_3" [size]="16" />
                Oszlopok igazítása
              </button>
              <div class="toolbar-dropdown__sep"></div>
              <button class="toolbar-dropdown__item"
                [disabled]="state.selectionCount() < 2"
                (click)="actions.arrangeToGrid()">
                <lucide-icon [name]="ICONS.LAYOUT_GRID" [size]="16" />
                Rácsba rendezés
              </button>
            </div>
          }
        </div>
      }

      <!-- Jobb: frissítés + mentés + bezárás -->
      <div class="layout-toolbar__right">
        <button
          class="toolbar-btn toolbar-btn--refresh"
          [disabled]="refreshing()"
          [class.is-refreshing]="refreshing()"
          (click)="refreshClicked.emit()"
          matTooltip="Frissítés Photoshopból"
        >
          <lucide-icon [name]="ICONS.REFRESH" [size]="16" />
        </button>
        <button
          class="toolbar-btn toolbar-btn--save"
          [disabled]="!state.hasChanges()"
          (click)="saveClicked.emit()"
          matTooltip="Módosítások mentése"
        >
          <lucide-icon [name]="ICONS.SAVE" [size]="16" />
          <span>Mentés</span>
        </button>
        <button
          class="toolbar-btn toolbar-btn--close"
          (click)="closeClicked.emit()"
          matTooltip="Bezárás"
        >
          <lucide-icon [name]="ICONS.X" [size]="18" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .layout-toolbar {
      display: flex;
      align-items: center;
      height: 56px;
      padding: 0 12px;
      background: #1e1e38;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
      position: relative;
      z-index: 20;
    }

    .layout-toolbar__left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
    }

    .layout-toolbar__doc-info {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
      white-space: nowrap;
    }

    .layout-toolbar__separator {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.12);
      flex-shrink: 0;
    }

    .layout-toolbar__selection {
      font-size: 0.75rem;
      color: #a78bfa;
      font-weight: 600;
      white-space: nowrap;
    }

    .layout-toolbar__divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 2px;
      flex-shrink: 0;
    }

    .layout-toolbar__right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      margin-left: auto;
      padding-left: 8px;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 32px;
      min-width: 32px;
      padding: 0 6px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.12s ease;
      font-size: 0.75rem;
      font-weight: 500;
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &--active {
        background: rgba(124, 58, 237, 0.3) !important;
        color: #a78bfa !important;
        border: 1px solid rgba(124, 58, 237, 0.4);
      }

      &--grid { padding: 0 8px; }

      &__label {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.03em;
      }

      &--refresh {
        padding: 0 10px;
        &:hover:not(:disabled) { color: #a78bfa; }
        &.is-refreshing lucide-icon { animation: spin 1s linear infinite; }
      }

      &--save {
        background: #7c3aed;
        color: #ffffff;
        padding: 0 12px;
        &:hover:not(:disabled) { background: #6d28d9; }
        &:disabled { opacity: 0.4; }
      }

      &--close {
        background: rgba(255, 255, 255, 0.06);
        &:hover { background: rgba(239, 68, 68, 0.3); color: #fca5a5; }
      }
    }

    /* Dropdown menü */
    .toolbar-dropdown {
      position: relative;
    }

    .toolbar-dropdown__panel {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: #2a2a4a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 4px;
      min-width: 200px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: 100;
    }

    .toolbar-dropdown__item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      cursor: pointer;
      text-align: left;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .toolbar-dropdown__sep {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 4px 8px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutToolbarComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly actions = inject(LayoutDesignerActionsService);
  readonly gridService = inject(LayoutDesignerGridService);
  readonly sortService = inject(LayoutDesignerSortService);
  protected readonly ICONS = ICONS;

  readonly refreshing = input<boolean>(false);
  readonly moreOpen = signal(false);

  readonly saveClicked = output<void>();
  readonly closeClicked = output<void>();
  readonly refreshClicked = output<void>();
}
