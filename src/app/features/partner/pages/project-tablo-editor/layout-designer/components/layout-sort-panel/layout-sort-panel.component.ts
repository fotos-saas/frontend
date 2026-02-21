import { Component, ChangeDetectionStrategy, inject, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

/**
 * Fix bal oldali sidebar a Layout Designerben.
 * Rendezési szekció + Minta készítés szekció.
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
            (click)="sortService.sortByGender()"
            matTooltip="Felváltva fiú-lány-fiú-lány">
            <lucide-icon [name]="ICONS.USERS" [size]="16" />
            <span>Felváltva</span>
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

      <!-- Műveletek szekció -->
      <div class="sidebar__section sidebar__section--separator">
        <div class="sidebar__section-header">
          <lucide-icon [name]="ICONS.SETTINGS" [size]="14" />
          <span>Műveletek</span>
        </div>

        <div class="sidebar__actions">
          <div class="sidebar__split-btn">
            <button class="sidebar__split-main"
              [disabled]="generatingSample()"
              (click)="generateSample.emit()"
              matTooltip="Vízjeles mintakép generálás">
              @if (generatingSample()) {
                <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
                <span>Generálás...</span>
              } @else {
                <lucide-icon [name]="ICONS.IMAGE" [size]="16" />
                <span>Minta</span>
              }
            </button>
            <button class="sidebar__split-toggle"
              [class.sidebar__split-toggle--active]="sampleLargeSize()"
              (click)="sampleLargeSizeChange.emit(!sampleLargeSize())"
              [matTooltip]="sampleLargeSize() ? 'Nagy méret — kattints a kis mérethez' : 'Kis méret — kattints a nagy mérethez'">
              {{ sampleLargeSize() ? 'HD' : 'SD' }}
            </button>
            <button class="sidebar__split-toggle sidebar__split-color"
              [class.sidebar__split-color--white]="sampleWatermarkColor() === 'white'"
              (click)="watermarkColorChange.emit(sampleWatermarkColor() === 'white' ? 'black' : 'white')"
              [matTooltip]="sampleWatermarkColor() === 'white' ? 'Fehér vízjel — kattints a feketéhez' : 'Fekete vízjel — kattints a fehérhez'">
              @if (sampleWatermarkColor() === 'white') {
                <lucide-icon [name]="ICONS.SUN" [size]="11" />
              } @else {
                <lucide-icon [name]="ICONS.MOON" [size]="11" />
              }
            </button>
            <button class="sidebar__split-toggle sidebar__split-opacity"
              (click)="opacityChange.emit()"
              [matTooltip]="'Átlátszóság: ' + opacityPercent() + '% — kattints a váltáshoz'">
              {{ opacityPercent() }}%
            </button>
          </div>
          <button class="action-btn"
            (click)="openProject.emit()"
            matTooltip="A PSD megnyitása Photoshopban">
            <lucide-icon [name]="ICONS.FILE_PLUS" [size]="16" />
            <span>Projekt megnyitása</span>
          </button>
          <button class="action-btn"
            (click)="openWorkDir.emit()"
            matTooltip="A PSD munkamappa megnyitása Finderben">
            <lucide-icon [name]="ICONS.FOLDER_OPEN" [size]="16" />
            <span>Munkamappa</span>
          </button>
        </div>

        @if (sampleSuccess()) {
          <div class="sidebar__status sidebar__status--success">
            <lucide-icon [name]="ICONS.CHECK" [size]="14" />
            {{ sampleSuccess() }}
          </div>
        }
        @if (sampleError()) {
          <div class="sidebar__status sidebar__status--error">
            <lucide-icon [name]="ICONS.X_CIRCLE" [size]="14" />
            {{ sampleError() }}
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

    .sidebar__actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
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
      &--error { color: #fca5a5; }
    }

    .sidebar__split-btn {
      display: flex;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .sidebar__split-main {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.8rem;
      border: none;
      cursor: pointer;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }

      &:disabled {
        opacity: 0.25;
        cursor: not-allowed;
      }
    }

    .sidebar__split-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      border: none;
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.7);
      }

      &--active {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;

        &:hover {
          background: rgba(16, 185, 129, 0.3);
        }
      }
    }

    .sidebar__split-color {
      width: 26px;

      &--white {
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.9);

        &:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      }

      &:not(.sidebar__split-color--white) {
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.5);

        &:hover {
          background: rgba(0, 0, 0, 0.5);
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .sidebar__split-opacity {
      width: 32px;
      font-size: 0.55rem;
      font-weight: 600;
    }

    .sidebar__section--separator {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
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
  readonly generateSample = output<void>();
  readonly openProject = output<void>();
  readonly openWorkDir = output<void>();

  /** Minta generálás állapotok (a szülő kezeli) */
  readonly generatingSample = input(false);
  readonly sampleLargeSize = input(false);
  readonly sampleLargeSizeChange = output<boolean>();
  readonly sampleWatermarkColor = input<'white' | 'black'>('white');
  readonly watermarkColorChange = output<'white' | 'black'>();
  readonly sampleWatermarkOpacity = input(0.15);
  readonly opacityChange = output<void>();
  readonly opacityPercent = computed(() => Math.round(this.sampleWatermarkOpacity() * 100));
  readonly sampleSuccess = input<string | null>(null);
  readonly sampleError = input<string | null>(null);
}
