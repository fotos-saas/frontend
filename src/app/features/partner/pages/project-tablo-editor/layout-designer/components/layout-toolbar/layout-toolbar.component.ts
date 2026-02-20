import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';
import { LayoutDesignerGridService } from '../../layout-designer-grid.service';

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
      <!-- Bal: dokumentum info + grid toggle -->
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
      </div>

      <!-- Közép: kijelölés info + igazítás gombok -->
      <div class="layout-toolbar__center">
        @if (state.hasSelection()) {
          <span class="layout-toolbar__selection">
            {{ state.selectionCount() }} kijelölve
          </span>
        }

        <div class="layout-toolbar__actions">
          <button
            class="toolbar-btn"
            [disabled]="state.selectionCount() < 2"
            (click)="actions.alignLeft()"
            matTooltip="Balra igazítás"
          >
            <lucide-icon [name]="ICONS.ALIGN_LEFT" [size]="16" />
          </button>
          <button
            class="toolbar-btn"
            [disabled]="state.selectionCount() < 2"
            (click)="actions.alignCenterHorizontal()"
            matTooltip="Vízszintes középre"
          >
            <lucide-icon [name]="ICONS.ALIGN_CENTER_V" [size]="16" />
          </button>
          <button
            class="toolbar-btn"
            [disabled]="state.selectionCount() < 2"
            (click)="actions.alignTop()"
            matTooltip="Tetejére igazítás"
          >
            <lucide-icon [name]="ICONS.ALIGN_START_V" [size]="16" />
          </button>

          <div class="layout-toolbar__divider"></div>

          <button
            class="toolbar-btn"
            [disabled]="state.selectionCount() < 3"
            (click)="actions.distributeHorizontal()"
            matTooltip="Vízszintes elosztás"
          >
            <lucide-icon [name]="ICONS.ALIGN_H_DISTRIBUTE" [size]="16" />
          </button>
          <button
            class="toolbar-btn"
            [disabled]="state.selectionCount() < 3"
            (click)="actions.distributeVertical()"
            matTooltip="Függőleges elosztás"
          >
            <lucide-icon [name]="ICONS.ALIGN_V_DISTRIBUTE" [size]="16" />
          </button>
          <button
            class="toolbar-btn"
            [disabled]="state.selectionCount() < 2"
            (click)="actions.alignRows()"
            matTooltip="Sorok igazítása"
          >
            <lucide-icon [name]="ICONS.ROWS_3" [size]="16" />
          </button>
        </div>
      </div>

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
          <span>{{ refreshing() ? 'Frissítés...' : 'Frissítés' }}</span>
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
      padding: 0 16px;
      background: #1e1e38;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    .layout-toolbar__left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .layout-toolbar__doc-info {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    .layout-toolbar__separator {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.12);
    }

    .layout-toolbar__center {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .layout-toolbar__selection {
      font-size: 0.8rem;
      color: #a78bfa;
      font-weight: 600;
      white-space: nowrap;
    }

    .layout-toolbar__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .layout-toolbar__divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 4px;
    }

    .layout-toolbar__right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      min-width: 34px;
      padding: 0 8px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.12s ease;
      font-size: 0.8rem;
      font-weight: 500;

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

      &--grid {
        padding: 0 10px;
      }

      &__label {
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.03em;
      }

      &--refresh {
        padding: 0 14px;

        &:hover:not(:disabled) {
          color: #a78bfa;
        }

        &.is-refreshing lucide-icon {
          animation: spin 1s linear infinite;
        }
      }

      &--save {
        background: #7c3aed;
        color: #ffffff;
        padding: 0 14px;

        &:hover:not(:disabled) { background: #6d28d9; }
        &:disabled { opacity: 0.4; }
      }

      &--close {
        background: rgba(255, 255, 255, 0.06);

        &:hover { background: rgba(239, 68, 68, 0.3); color: #fca5a5; }
      }
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
  protected readonly ICONS = ICONS;

  readonly refreshing = input<boolean>(false);

  readonly saveClicked = output<void>();
  readonly closeClicked = output<void>();
  readonly refreshClicked = output<void>();
}
