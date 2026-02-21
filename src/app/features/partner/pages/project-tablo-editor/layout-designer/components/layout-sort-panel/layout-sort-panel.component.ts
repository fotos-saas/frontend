import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

/**
 * Rendezés panel — jobb oldalon csúszó panel a rendezési akciókhoz.
 */
@Component({
  selector: 'app-layout-sort-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="sort-panel" [class.sort-panel--open]="sortService.panelOpen()">
      <!-- Fejléc -->
      <div class="sort-panel__header">
        <span class="sort-panel__title">Rendezés</span>
        <button class="sort-panel__close" (click)="sortService.panelOpen.set(false)"
          matTooltip="Panel bezárása">
          <lucide-icon [name]="ICONS.X" [size]="16" />
        </button>
      </div>

      <!-- Kijelölés info -->
      <div class="sort-panel__info">
        {{ state.selectionCount() }} kijelölve
      </div>

      <!-- Olvasási irány toggle -->
      <div class="sort-panel__section">
        <span class="sort-panel__label">Olvasási irány</span>
        <div class="sort-panel__toggle">
          <button class="toggle-btn"
            [class.toggle-btn--active]="sortService.gridPattern() === 'ltr'"
            (click)="sortService.gridPattern.set('ltr')">
            Balról jobbra &#8595;
          </button>
          <button class="toggle-btn"
            [class.toggle-btn--active]="sortService.gridPattern() === 'u-shape'"
            (click)="sortService.gridPattern.set('u-shape')">
            U-alakzat &#8617;
          </button>
        </div>
      </div>

      <!-- Rendezési gombok -->
      <div class="sort-panel__section">
        <span class="sort-panel__label">Rendezési mód</span>
        <div class="sort-panel__actions">
          <button class="sort-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="sortService.sortByAbc()">
            <lucide-icon [name]="ICONS.ARROW_DOWN_AZ" [size]="18" />
            <span>Magyar ABC</span>
          </button>
          <button class="sort-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="sortService.sortByGender(true)">
            <lucide-icon [name]="ICONS.USERS" [size]="18" />
            <span>Fiúk elöl</span>
          </button>
          <button class="sort-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="sortService.sortByGender(false)">
            <lucide-icon [name]="ICONS.USERS" [size]="18" />
            <span>Lányok elöl</span>
          </button>
          <button class="sort-btn"
            [disabled]="sortService.sorting() || state.selectionCount() < 2"
            (click)="openCustomDialog.emit()">
            <lucide-icon [name]="ICONS.LIST_ORDERED" [size]="18" />
            <span>Egyedi sorrend...</span>
          </button>
        </div>
      </div>

      <!-- Loading state -->
      @if (sortService.sorting()) {
        <div class="sort-panel__loading">
          <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
          <span>AI feldolgozás...</span>
        </div>
      }

      <!-- Eredmény -->
      @if (sortService.lastResult(); as result) {
        <div class="sort-panel__result">
          <lucide-icon [name]="ICONS.CHECK" [size]="16" />
          <span>{{ result }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .sort-panel {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 280px;
      background: #2a2a4a;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      z-index: 30;
      transform: translateX(100%);
      transition: transform 0.2s ease;
      overflow-y: auto;

      &--open { transform: translateX(0); }
    }

    .sort-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sort-panel__title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #ffffff;
    }

    .sort-panel__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }
    }

    .sort-panel__info {
      padding: 12px 16px;
      font-size: 0.8rem;
      color: #a78bfa;
      font-weight: 600;
    }

    .sort-panel__section {
      padding: 0 16px 16px;
    }

    .sort-panel__label {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .sort-panel__toggle {
      display: flex;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 2px;
    }

    .toggle-btn {
      flex: 1;
      padding: 6px 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(.toggle-btn--active) {
        color: rgba(255, 255, 255, 0.8);
      }

      &--active {
        background: rgba(124, 58, 237, 0.3);
        color: #a78bfa;
      }
    }

    .sort-panel__actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.12s ease;
      text-align: left;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .sort-panel__loading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      color: #a78bfa;
      font-size: 0.8rem;
    }

    .sort-panel__result {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      color: #4ade80;
      font-size: 0.8rem;
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
