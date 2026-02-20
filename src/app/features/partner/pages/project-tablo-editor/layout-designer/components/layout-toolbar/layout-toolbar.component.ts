import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';

/**
 * Layout Toolbar — eszköztár a vizuális szerkesztő tetején.
 * Dokumentum info, igazítás gombok, mentés + bezárás.
 */
@Component({
  selector: 'app-layout-toolbar',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="layout-toolbar">
      <!-- Bal: dokumentum info -->
      <div class="layout-toolbar__left">
        @if (state.documentSizeCm(); as size) {
          <span class="layout-toolbar__doc-info">
            {{ size.widthCm }} &times; {{ size.heightCm }} cm
          </span>
        }
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
            (click)="actions.alignTop()"
            matTooltip="Felsők igazítása"
          >
            <lucide-icon [name]="ICONS.ALIGN_LEFT" [size]="16" />
          </button>
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
            matTooltip="Sorok automatikus igazítása"
          >
            <lucide-icon [name]="ICONS.GRID" [size]="16" />
          </button>
        </div>
      </div>

      <!-- Jobb: mentés + bezárás -->
      <div class="layout-toolbar__right">
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
    }

    .layout-toolbar__doc-info {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
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
      gap: 4px;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutToolbarComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly actions = inject(LayoutDesignerActionsService);
  protected readonly ICONS = ICONS;

  readonly saveClicked = output<void>();
  readonly closeClicked = output<void>();
}
