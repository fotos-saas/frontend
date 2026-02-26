import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { SnapshotListItem } from '@core/services/electron.types';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';
import { LayoutDesignerGridService } from '../../layout-designer-grid.service';

/**
 * Layout Toolbar — eszköztár a vizuális szerkesztő tetején.
 * Dokumentum info, grid toggle, fotó behelyezés, link/unlink, mentés + bezárás.
 * Az igazítás gombok a floating toolbar-ban vannak (LayoutFloatingToolbarComponent).
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

        @if (state.sourceLabel(); as label) {
          <div class="source-picker">
            <button
              class="source-badge"
              [class.source-badge--live]="label === 'Friss PSD beolvasás'"
              (click)="pickerOpen.set(!pickerOpen())"
            >
              @if (label === 'Friss PSD beolvasás') {
                <lucide-icon [name]="ICONS.MONITOR" [size]="13" />
                <span class="source-badge__type">Élő PSD</span>
              } @else {
                <lucide-icon [name]="ICONS.HISTORY" [size]="13" />
                <span class="source-badge__type">Pillanatkép:</span>
                <span class="source-badge__name">{{ label }}</span>
              }
              @if (state.sourceDate()) {
                <span class="source-badge__date">{{ formatDate(state.sourceDate()) }}</span>
              }
              <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="11" class="source-badge__chevron" />
            </button>
          </div>
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

        <div class="layout-toolbar__separator"></div>

        <!-- Igazítás collapse trigger -->
        <button
          class="toolbar-btn"
          [class.toolbar-btn--active]="alignPanelOpen()"
          (click)="alignPanelOpen.set(!alignPanelOpen())"
          matTooltip="Igazítás"
        >
          <lucide-icon [name]="ICONS.MOVE" [size]="16" />
        </button>

        <!-- Igazítás gombok (collapse panel) -->
        <div class="align-collapse" [class.align-collapse--open]="alignPanelOpen()">
          <div class="align-collapse__inner">
            <!-- Vízszintes igazítás -->
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.alignLeft()"
              matTooltip="Balra igazítás"
            >
              <lucide-icon [name]="ICONS.ALIGN_START_V" [size]="15" />
            </button>
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.alignCenterHorizontal()"
              matTooltip="Vízszintes középre"
            >
              <lucide-icon [name]="ICONS.ALIGN_CENTER_V" [size]="15" />
            </button>
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.alignRight()"
              matTooltip="Jobbra igazítás"
            >
              <lucide-icon [name]="ICONS.ALIGN_END_V" [size]="15" />
            </button>

            <div class="align-collapse__sep"></div>

            <!-- Függőleges igazítás -->
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.alignTop()"
              matTooltip="Tetejére igazítás"
            >
              <lucide-icon [name]="ICONS.ALIGN_START_H" [size]="15" />
            </button>
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.alignCenterVertical()"
              matTooltip="Függőleges középre"
            >
              <lucide-icon [name]="ICONS.ALIGN_CENTER_H" [size]="15" />
            </button>
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.alignBottom()"
              matTooltip="Aljára igazítás"
            >
              <lucide-icon [name]="ICONS.ALIGN_END_H" [size]="15" />
            </button>

            <div class="align-collapse__sep"></div>

            <!-- Dokumentum középre -->
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 1"
              (click)="actions.centerOnDocument()"
              matTooltip="Dokumentum közepére"
            >
              <lucide-icon [name]="ICONS.MOVE" [size]="15" />
            </button>

            <div class="align-collapse__sep"></div>

            <!-- Elosztás / rendezés -->
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 3"
              (click)="actions.distributeHorizontal()"
              matTooltip="Vízszintes elosztás"
            >
              <lucide-icon [name]="ICONS.ALIGN_H_DISTRIBUTE" [size]="15" />
            </button>
            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 3"
              (click)="actions.distributeVertical()"
              matTooltip="Függőleges elosztás"
            >
              <lucide-icon [name]="ICONS.ALIGN_V_DISTRIBUTE" [size]="15" />
            </button>

            <div class="align-collapse__sep"></div>

            <button
              class="toolbar-btn toolbar-btn--compact"
              [disabled]="state.selectionCount() < 2"
              (click)="actions.arrangeToGrid()"
              matTooltip="Rácsba rendezés"
            >
              <lucide-icon [name]="ICONS.LAYOUT_GRID" [size]="15" />
            </button>
          </div>
        </div>

      </div>

      <!-- Source picker dropdown (toolbar szintjén, overflow: hidden miatt) -->
      @if (pickerOpen()) {
        <div class="source-picker__backdrop" (click)="pickerOpen.set(false)"></div>
        <div class="source-picker__panel">
          <div class="source-picker__header">Forrás váltása</div>

          <!-- Élő PSD opció -->
          <button
            class="source-picker__item"
            [class.source-picker__item--active]="state.sourceLabel() === 'Friss PSD beolvasás'"
            (click)="onPickLivePsd()"
          >
            <lucide-icon [name]="ICONS.MONITOR" [size]="14" class="source-picker__icon--live" />
            <div class="source-picker__item-info">
              <span class="source-picker__item-name">Friss PSD beolvasás</span>
              <span class="source-picker__item-desc">Photoshop aktuális állapota</span>
            </div>
          </button>

          <div class="source-picker__sep"></div>

          <!-- Snapshot-ok -->
          @for (snap of snapshots(); track snap.fileName) {
            <button
              class="source-picker__item"
              [class.source-picker__item--active]="state.sourceLabel() === snap.snapshotName"
              [disabled]="switchingSnapshot()"
              (click)="onPickSnapshot(snap)"
            >
              <lucide-icon [name]="ICONS.HISTORY" [size]="14" />
              <div class="source-picker__item-info">
                <span class="source-picker__item-name">{{ snap.snapshotName }}</span>
                <span class="source-picker__item-meta">
                  {{ formatDate(snap.createdAt) }} · {{ snap.personCount }} layer
                </span>
              </div>
              @if (state.sourceLabel() === snap.snapshotName) {
                <lucide-icon [name]="ICONS.CHECK" [size]="14" class="source-picker__check" />
              }
            </button>
          }

          @if (snapshots().length === 0) {
            <div class="source-picker__empty">Nincs elérhető pillanatkép</div>
          }
        </div>
      }

      <!-- Jobb: szinkronizálás + nevek + frissítés + mentés + bezárás -->
      <div class="layout-toolbar__right">
        <button
          class="toolbar-btn toolbar-btn--sync"
          [disabled]="syncing()"
          [class.is-syncing]="syncing()"
          (click)="syncClicked.emit()"
          matTooltip="Fotók szinkronizálása a Photoshopba"
        >
          <lucide-icon [name]="ICONS.IMAGE_DOWN" [size]="16" />
          @if (!syncing()) {
            <span>Szinkron</span>
          } @else {
            <span>Szinkronizálás...</span>
          }
        </button>

        <!-- Nevek igazítása gomb + beállítások -->
        <div class="names-group">
          <button
            class="toolbar-btn toolbar-btn--names"
            [disabled]="arrangingNames()"
            [class.is-arranging]="arrangingNames()"
            (click)="arrangeNamesClicked.emit()"
            matTooltip="Nevek igazítása a beállítások szerint"
          >
            <lucide-icon [name]="ICONS.ALIGN_CENTER" [size]="16" />
            @if (!arrangingNames()) {
              <span>Nevek</span>
            } @else {
              <span>Rendezés...</span>
            }
          </button>
          <button
            class="toolbar-btn toolbar-btn--names-settings"
            (click)="nameSettingsOpen.set(!nameSettingsOpen())"
            matTooltip="Név beállítások"
          >
            <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="12" />
          </button>
        </div>

        <!-- Elrendezés gomb -->
        <button
          class="toolbar-btn toolbar-btn--relocate"
          [disabled]="relocating() || !state.hasChanges()"
          [class.is-relocating]="relocating()"
          (click)="relocateClicked.emit()"
          matTooltip="Kijelölt layerek áthelyezése a Photoshopban"
        >
          <lucide-icon [name]="ICONS.LAYOUT_GRID" [size]="16" />
          @if (!relocating()) {
            <span>Elrendezés</span>
          } @else {
            <span>Áthelyezés...</span>
          }
        </button>

        <!-- Pozíciók gomb + beállítások -->
        <div class="names-group">
          <button
            class="toolbar-btn toolbar-btn--positions"
            [disabled]="updatingPositions()"
            [class.is-updating]="updatingPositions()"
            (click)="updatePositionsClicked.emit()"
            matTooltip="Pozíció és felirat frissítése"
          >
            <lucide-icon [name]="ICONS.TAG" [size]="16" />
            @if (!updatingPositions()) {
              <span>Pozíciók</span>
            } @else {
              <span>Frissítés...</span>
            }
          </button>
          <button
            class="toolbar-btn toolbar-btn--positions-settings"
            (click)="positionSettingsOpen.set(!positionSettingsOpen())"
            matTooltip="Pozíció beállítások"
          >
            <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="12" />
          </button>
        </div>

        @if (nameSettingsOpen()) {
          <div class="name-settings__backdrop" (click)="nameSettingsOpen.set(false)"></div>
          <div class="name-settings__panel">
            <div class="name-settings__title">Név beállítások</div>

            <label class="name-settings__label">Rés a kép aljától (cm)</label>
            <input
              class="name-settings__input"
              type="number" step="0.1" min="0" max="5"
              [value]="nameGapCm()"
              (change)="nameGapChanged.emit(+$any($event.target).value)"
            />

            <label class="name-settings__label">Sortörés</label>
            <select
              class="name-settings__select"
              (change)="nameBreakChanged.emit(+$any($event.target).value)"
            >
              <option value="1" [selected]="nameBreakAfter() === 1">1. szó után</option>
              <option value="2" [selected]="nameBreakAfter() === 2">2. szó után</option>
              <option value="0" [selected]="nameBreakAfter() === 0">Nincs törés</option>
            </select>

            <label class="name-settings__label">Igazítás</label>
            <div class="name-settings__align">
              <button
                class="name-settings__align-btn"
                [class.name-settings__align-btn--active]="textAlign() === 'left'"
                (click)="textAlignChanged.emit('left')"
              >
                <lucide-icon [name]="ICONS.ALIGN_LEFT" [size]="14" />
              </button>
              <button
                class="name-settings__align-btn"
                [class.name-settings__align-btn--active]="textAlign() === 'center'"
                (click)="textAlignChanged.emit('center')"
              >
                <lucide-icon [name]="ICONS.ALIGN_CENTER" [size]="14" />
              </button>
              <button
                class="name-settings__align-btn"
                [class.name-settings__align-btn--active]="textAlign() === 'right'"
                (click)="textAlignChanged.emit('right')"
              >
                <lucide-icon [name]="ICONS.ALIGN_RIGHT" [size]="14" />
              </button>
            </div>

            <div class="name-settings__sep"></div>

            <button
              class="name-settings__apply-btn"
              [disabled]="arrangingNames()"
              (click)="arrangeNamesClicked.emit()"
            >
              <lucide-icon [name]="ICONS.PLAY" [size]="14" />
              @if (!arrangingNames()) {
                <span>Nevek rendezése</span>
              } @else {
                <span>Rendezés...</span>
              }
            </button>
          </div>
        }

        @if (positionSettingsOpen()) {
          <div class="name-settings__backdrop" (click)="positionSettingsOpen.set(false)"></div>
          <div class="name-settings__panel position-settings__panel">
            <div class="name-settings__title">Pozíció beállítások</div>

            <label class="name-settings__label">Rés a név aljától (cm)</label>
            <input
              class="name-settings__input"
              type="number" step="0.05" min="0" max="3"
              [value]="positionGapCm()"
              (change)="positionGapChanged.emit(+$any($event.target).value)"
            />

            <label class="name-settings__label">Font méret (pt)</label>
            <input
              class="name-settings__input"
              type="number" step="1" min="6" max="100"
              [value]="positionFontSize()"
              (change)="positionFontSizeChanged.emit(+$any($event.target).value)"
            />

            <div class="name-settings__sep"></div>

            <button
              class="name-settings__apply-btn position-settings__apply-btn"
              [disabled]="updatingPositions()"
              (click)="updatePositionsClicked.emit()"
            >
              <lucide-icon [name]="ICONS.PLAY" [size]="14" />
              @if (!updatingPositions()) {
                <span>Pozíciók frissítése</span>
              } @else {
                <span>Frissítés...</span>
              }
            </button>
          </div>
        }
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

    .source-picker {
      position: relative;
    }

    .source-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(167, 139, 250, 0.12);
      border: 1px solid rgba(167, 139, 250, 0.25);
      white-space: nowrap;
      max-width: 320px;
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover {
        background: rgba(167, 139, 250, 0.2);
        border-color: rgba(167, 139, 250, 0.4);
      }

      &__type {
        font-size: 0.72rem;
        font-weight: 600;
        color: #a78bfa;
      }

      &__name {
        font-size: 0.72rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.75);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &__date {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        margin-left: 2px;
      }

      &__chevron {
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
        margin-left: 2px;
      }

      lucide-icon:not(.source-badge__chevron) {
        color: #a78bfa;
        flex-shrink: 0;
      }

      &--live {
        background: rgba(52, 211, 153, 0.12);
        border-color: rgba(52, 211, 153, 0.3);

        &:hover {
          background: rgba(52, 211, 153, 0.2);
          border-color: rgba(52, 211, 153, 0.4);
        }

        .source-badge__type { color: #34d399; }
        lucide-icon:not(.source-badge__chevron) { color: #34d399; }
      }
    }

    .source-picker__backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .source-picker__panel {
      position: absolute;
      top: 100%;
      left: 80px;
      margin-top: 4px;
      background: #2a2a4a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 6px;
      min-width: 300px;
      max-width: 380px;
      max-height: 320px;
      overflow-y: auto;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      z-index: 200;
      -webkit-overflow-scrolling: touch;
    }

    .source-picker__header {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 10px 4px;
    }

    .source-picker__sep {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 4px 8px;
    }

    .source-picker__item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      border-radius: 7px;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: all 0.1s ease;
      color: rgba(255, 255, 255, 0.7);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &--active {
        background: rgba(124, 58, 237, 0.15);

        &:hover:not(:disabled) {
          background: rgba(124, 58, 237, 0.2);
        }
      }

      lucide-icon {
        color: rgba(255, 255, 255, 0.5);
        flex-shrink: 0;
      }
    }

    .source-picker__icon--live {
      color: #34d399 !important;
    }

    .source-picker__check {
      color: #a78bfa !important;
      margin-left: auto;
      flex-shrink: 0;
    }

    .source-picker__item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .source-picker__item-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .source-picker__item-desc {
      font-size: 0.68rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .source-picker__item-meta {
      font-size: 0.68rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .source-picker__empty {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.35);
      padding: 12px 10px;
      text-align: center;
    }

    .layout-toolbar__separator {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.12);
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

      &--sync {
        padding: 0 10px;
        background: rgba(52, 211, 153, 0.15);
        color: #34d399;
        &:hover:not(:disabled) { background: rgba(52, 211, 153, 0.25); color: #6ee7b7; }
        &:disabled { opacity: 0.4; }
        &.is-syncing lucide-icon { animation: spin 1s linear infinite; }
      }

      &--names {
        padding: 0 10px;
        background: rgba(167, 139, 250, 0.15);
        color: #a78bfa;
        border-radius: 6px 0 0 6px;
        &:hover:not(:disabled) { background: rgba(167, 139, 250, 0.25); color: #c4b5fd; }
        &:disabled { opacity: 0.4; }
        &.is-arranging lucide-icon { animation: spin 1s linear infinite; }
      }

      &--names-settings {
        padding: 0 4px;
        min-width: 24px;
        background: rgba(167, 139, 250, 0.15);
        color: #a78bfa;
        border-radius: 0 6px 6px 0;
        border-left: 1px solid rgba(167, 139, 250, 0.3);
        &:hover { background: rgba(167, 139, 250, 0.25); color: #c4b5fd; }
      }

      &--relocate {
        padding: 0 10px;
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        &:hover:not(:disabled) { background: rgba(59, 130, 246, 0.25); color: #60a5fa; }
        &:disabled { opacity: 0.4; }
        &.is-relocating lucide-icon { animation: spin 1s linear infinite; }
      }

      &--positions {
        padding: 0 10px;
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
        border-radius: 6px 0 0 6px;
        &:hover:not(:disabled) { background: rgba(251, 191, 36, 0.25); color: #fcd34d; }
        &:disabled { opacity: 0.4; }
        &.is-updating lucide-icon { animation: spin 1s linear infinite; }
      }

      &--positions-settings {
        padding: 0 4px;
        min-width: 24px;
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
        border-radius: 0 6px 6px 0;
        border-left: 1px solid rgba(251, 191, 36, 0.3);
        &:hover { background: rgba(251, 191, 36, 0.25); color: #fcd34d; }
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

    .names-group {
      display: flex;
      align-items: center;
    }

    .name-settings__backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .name-settings__panel {
      position: absolute;
      top: 100%;
      right: 120px;
      margin-top: 4px;
      background: #2a2a4a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px;
      min-width: 220px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .name-settings__title {
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .name-settings__label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .name-settings__input,
    .name-settings__select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      font-size: 0.8rem;
      outline: none;
      -webkit-appearance: none;
      &:focus { border-color: rgba(167, 139, 250, 0.5); }
    }

    .name-settings__select option {
      background: #2a2a4a;
      color: #ffffff;
    }

    .name-settings__align {
      display: flex;
      gap: 4px;
    }

    .name-settings__align-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 28px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.1s ease;

      &:hover { background: rgba(255, 255, 255, 0.12); color: #ffffff; }

      &--active {
        background: rgba(167, 139, 250, 0.25);
        border-color: rgba(167, 139, 250, 0.4);
        color: #a78bfa;
      }
    }

    .name-settings__sep {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 4px 0;
    }

    .position-settings__panel {
      right: 180px;
    }

    .position-settings__apply-btn {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      &:hover:not(:disabled) { background: rgba(251, 191, 36, 0.35); color: #fcd34d; }
    }

    .name-settings__apply-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 7px 0;
      border: none;
      border-radius: 6px;
      background: rgba(167, 139, 250, 0.2);
      color: #a78bfa;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover:not(:disabled) { background: rgba(167, 139, 250, 0.35); color: #c4b5fd; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    /* Align collapse panel */
    .align-collapse {
      max-width: 0;
      overflow: hidden;
      transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      &--open {
        max-width: 500px;
      }
    }

    .align-collapse__inner {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0 4px;
      white-space: nowrap;
    }

    .align-collapse__sep {
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
      margin: 0 2px;
    }

    .toolbar-btn--compact {
      height: 28px;
      min-width: 28px;
      padding: 0 4px;
      border-radius: 5px;
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

  readonly alignPanelOpen = signal(false);

  readonly refreshing = input<boolean>(false);
  readonly syncing = input<boolean>(false);
  readonly arrangingNames = input<boolean>(false);
  readonly snapshots = input<SnapshotListItem[]>([]);
  readonly switchingSnapshot = input<boolean>(false);
  readonly nameGapCm = input<number>(0.5);
  readonly nameBreakAfter = input<number>(1);
  readonly textAlign = input<string>('center');
  readonly relocating = input<boolean>(false);
  readonly updatingPositions = input<boolean>(false);
  readonly positionGapCm = input<number>(0.15);
  readonly positionFontSize = input<number>(18);
  readonly pickerOpen = signal(false);
  readonly nameSettingsOpen = signal(false);
  readonly positionSettingsOpen = signal(false);

  readonly saveClicked = output<void>();
  readonly closeClicked = output<void>();
  readonly refreshClicked = output<void>();
  readonly syncClicked = output<void>();
  readonly arrangeNamesClicked = output<void>();
  readonly nameGapChanged = output<number>();
  readonly nameBreakChanged = output<number>();
  readonly textAlignChanged = output<string>();
  readonly relocateClicked = output<void>();
  readonly updatePositionsClicked = output<void>();
  readonly positionGapChanged = output<number>();
  readonly positionFontSizeChanged = output<number>();
  readonly snapshotSelected = output<SnapshotListItem>();

  formatDate(isoDate: string | null): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }

  onPickLivePsd(): void {
    this.pickerOpen.set(false);
    this.refreshClicked.emit();
  }

  onPickSnapshot(snap: SnapshotListItem): void {
    this.pickerOpen.set(false);
    this.snapshotSelected.emit(snap);
  }

}
