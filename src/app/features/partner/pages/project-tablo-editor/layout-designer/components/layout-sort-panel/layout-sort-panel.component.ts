import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

/**
 * Fix bal oldali sidebar a Layout Designerben.
 * Rendezési szekció — később bővíthető más szekciókkal.
 */
@Component({
  selector: 'app-layout-sort-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <aside class="sidebar">
      <!-- Rendezés szekció -->
      <div class="sidebar__section">
        <div class="sidebar__section-header">
          <lucide-icon [name]="ICONS.ARROW_DOWN_AZ" [size]="14" />
          <span>Rendezés</span>
        </div>

        <!-- Kijelölés info -->
        @if (state.hasSelection()) {
          <div class="sidebar__info">
            {{ state.selectionCount() }} kijelölve
          </div>
        }

        <!-- Olvasási irány toggle -->
        <div class="sidebar__field">
          <span class="sidebar__label">Olvasási irány</span>
          <div class="sidebar__toggle">
            <button class="toggle-btn"
              [class.toggle-btn--active]="sortService.gridPattern() === 'ltr'"
              (click)="sortService.gridPattern.set('ltr')">
              &#8595; LTR
            </button>
            <button class="toggle-btn"
              [class.toggle-btn--active]="sortService.gridPattern() === 'u-shape'"
              (click)="sortService.gridPattern.set('u-shape')">
              &#8617; U
            </button>
          </div>
        </div>

        <!-- Rendezési gombok -->
        <div class="sidebar__actions">
          <button class="action-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="sortService.sortByAbc()"
            matTooltip="Magyar ABC sorrend">
            <lucide-icon [name]="ICONS.ARROW_DOWN_AZ" [size]="16" />
            <span>ABC</span>
          </button>
          <button class="action-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="sortService.sortByGender(true)"
            matTooltip="Fiúk elöl, lányok hátul">
            <lucide-icon [name]="ICONS.USERS" [size]="16" />
            <span>Fiúk</span>
          </button>
          <button class="action-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="sortService.sortByGender(false)"
            matTooltip="Lányok elöl, fiúk hátul">
            <lucide-icon [name]="ICONS.USERS" [size]="16" />
            <span>Lányok</span>
          </button>
          <button class="action-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="openCustomDialog.emit()"
            matTooltip="Egyedi névlista szerinti sorrend">
            <lucide-icon [name]="ICONS.LIST_ORDERED" [size]="16" />
            <span>Egyedi</span>
          </button>
        </div>

        <!-- Loading / eredmény -->
        @if (sortService.sorting()) {
          <div class="sidebar__status sidebar__status--loading">
            <lucide-icon [name]="ICONS.LOADER" [size]="14" class="spin" />
            AI feldolgozás...
          </div>
        }
        @if (sortService.lastResult(); as result) {
          <div class="sidebar__status sidebar__status--success">
            <lucide-icon [name]="ICONS.CHECK" [size]="14" />
            {{ result }}
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #1e1e38;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar__section {
      padding: 12px;
    }

    .sidebar__section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }

    .sidebar__info {
      font-size: 0.75rem;
      color: #a78bfa;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .sidebar__field {
      margin-bottom: 10px;
    }

    .sidebar__label {
      display: block;
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.35);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .sidebar__toggle {
      display: flex;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 6px;
      padding: 2px;
    }

    .toggle-btn {
      flex: 1;
      padding: 4px 6px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: rgba(255, 255, 255, 0.45);
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover:not(.toggle-btn--active) {
        color: rgba(255, 255, 255, 0.7);
      }

      &--active {
        background: rgba(124, 58, 237, 0.3);
        color: #a78bfa;
      }
    }

    .sidebar__actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.65rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      &:disabled {
        opacity: 0.25;
        cursor: not-allowed;
      }
    }

    .sidebar__status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 0.7rem;
      line-height: 1.3;

      &--loading { color: #a78bfa; }
      &--success { color: #4ade80; }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSortPanelComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly sortService = inject(LayoutDesignerSortService);
  protected readonly ICONS = ICONS;

  readonly openCustomDialog = output<void>();
}
