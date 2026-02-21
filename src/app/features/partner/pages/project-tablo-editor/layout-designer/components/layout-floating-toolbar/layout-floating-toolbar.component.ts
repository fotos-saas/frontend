import { Component, ChangeDetectionStrategy, inject, computed, signal, output, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';

/** Toolbar magassága px-ben */
const TOOLBAR_HEIGHT = 40;
/** Gap a kijelölés és a toolbar között */
const GAP = 8;

/**
 * Floating Toolbar — Elementor-stílusú lebegő eszköztár a kijelölt elemek felett.
 * Igazítás, elosztás és dokumentum középre gombok.
 */
@Component({
  selector: 'app-layout-floating-toolbar',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    @if (position(); as pos) {
      <div
        class="floating-toolbar"
        [class.floating-toolbar--below]="pos.below"
        [style.left.px]="pos.x"
        [style.top.px]="pos.y"
      >
        <!-- Vízszintes igazítás: bal/közép/jobb -->
        <button class="ft-btn" [disabled]="state.selectionCount() < 2"
          (click)="actions.alignLeft()" matTooltip="Balra igazítás">
          <lucide-icon [name]="ICONS.ALIGN_START_V" [size]="15" />
        </button>
        <button class="ft-btn" [disabled]="state.selectionCount() < 2"
          (click)="actions.alignCenterHorizontal()" matTooltip="Vízszintes középre">
          <lucide-icon [name]="ICONS.ALIGN_CENTER_V" [size]="15" />
        </button>
        <button class="ft-btn" [disabled]="state.selectionCount() < 2"
          (click)="actions.alignRight()" matTooltip="Jobbra igazítás">
          <lucide-icon [name]="ICONS.ALIGN_END_V" [size]="15" />
        </button>

        <div class="ft-divider"></div>

        <!-- Függőleges igazítás: fent/közép/lent -->
        <button class="ft-btn" [disabled]="state.selectionCount() < 2"
          (click)="actions.alignTop()" matTooltip="Tetejére igazítás">
          <lucide-icon [name]="ICONS.ALIGN_START_H" [size]="15" />
        </button>
        <button class="ft-btn" [disabled]="state.selectionCount() < 2"
          (click)="actions.alignCenterVertical()" matTooltip="Függőleges középre">
          <lucide-icon [name]="ICONS.ALIGN_CENTER_H" [size]="15" />
        </button>
        <button class="ft-btn" [disabled]="state.selectionCount() < 2"
          (click)="actions.alignBottom()" matTooltip="Aljára igazítás">
          <lucide-icon [name]="ICONS.ALIGN_END_H" [size]="15" />
        </button>

        <div class="ft-divider"></div>

        <!-- Dokumentum középre -->
        <button class="ft-btn"
          (click)="actions.centerOnDocument()" matTooltip="Dokumentum középre">
          <lucide-icon [name]="ICONS.MOVE" [size]="15" />
        </button>

        <div class="ft-divider"></div>

        <!-- Elosztás dropdown -->
        <div class="ft-dropdown">
          <button class="ft-btn" (click)="moreOpen.set(!moreOpen())"
            matTooltip="Elosztás és rendezés">
            <lucide-icon [name]="ICONS.LAYOUT_GRID" [size]="15" />
            <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="10" />
          </button>
          @if (moreOpen()) {
            <div class="ft-dropdown__backdrop" (click)="moreOpen.set(false)"></div>
            <div class="ft-dropdown__panel">
              <button class="ft-dropdown__item"
                [disabled]="state.selectionCount() < 3"
                (click)="moreOpen.set(false); actions.distributeHorizontal()">
                <lucide-icon [name]="ICONS.ALIGN_H_DISTRIBUTE" [size]="15" />
                Vízszintes elosztás
              </button>
              <button class="ft-dropdown__item"
                [disabled]="state.selectionCount() < 3"
                (click)="moreOpen.set(false); actions.distributeVertical()">
                <lucide-icon [name]="ICONS.ALIGN_V_DISTRIBUTE" [size]="15" />
                Függőleges elosztás
              </button>
              <div class="ft-dropdown__sep"></div>
              <button class="ft-dropdown__item"
                [disabled]="state.selectionCount() < 2"
                (click)="moreOpen.set(false); actions.alignRows()">
                <lucide-icon [name]="ICONS.ROWS_3" [size]="15" />
                Sorok igazítása
              </button>
              <button class="ft-dropdown__item"
                [disabled]="state.selectionCount() < 2"
                (click)="moreOpen.set(false); actions.alignColumns()">
                <lucide-icon [name]="ICONS.COLUMNS_3" [size]="15" />
                Oszlopok igazítása
              </button>
              <div class="ft-dropdown__sep"></div>
              <button class="ft-dropdown__item"
                [disabled]="state.selectionCount() < 2"
                (click)="moreOpen.set(false); actions.arrangeToGrid()">
                <lucide-icon [name]="ICONS.LAYOUT_GRID" [size]="15" />
                Rácsba rendezés
              </button>
            </div>
          }
        </div>

        <div class="ft-divider"></div>

        <!-- Fotó feltöltés -->
        <button class="ft-btn ft-btn--photo"
          (click)="uploadPhotoClicked.emit()" matTooltip="Fotó feltöltése">
          <lucide-icon [name]="ICONS.CAMERA" [size]="15" />
        </button>

        <!-- Link/Unlink a Photoshopban -->
        <button class="ft-btn" [disabled]="linking()"
          (click)="linkLayersClicked.emit()" matTooltip="Összelinkelés (kép + név)">
          <lucide-icon [name]="ICONS.LINK" [size]="15" />
        </button>
        <button class="ft-btn" [disabled]="linking()"
          (click)="unlinkLayersClicked.emit()" matTooltip="Linkelés megszüntetése">
          <lucide-icon [name]="ICONS.UNLINK" [size]="15" />
        </button>

        <div class="ft-divider"></div>

        <!-- Kijelölés info -->
        <span class="ft-info">{{ state.selectionCount() }} kijelölve</span>
      </div>
    }
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 150;
    }

    .floating-toolbar {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 8px;
      background: #2a2a4a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
      transform: translateX(-50%);
      animation: ftAppear 0.15s ease;
    }

    @keyframes ftAppear {
      from {
        opacity: 0;
        transform: translateX(-50%) scaleY(0.85);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) scaleY(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .floating-toolbar {
        animation: none;
      }
    }

    .ft-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      height: 28px;
      min-width: 28px;
      padding: 0 4px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.1s ease;
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &--photo {
        color: #34d399;
        &:hover:not(:disabled) {
          background: rgba(52, 211, 153, 0.2);
          color: #6ee7b7;
        }
      }
    }

    .ft-divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 2px;
      flex-shrink: 0;
    }

    .ft-info {
      font-size: 0.7rem;
      color: #a78bfa;
      font-weight: 600;
      white-space: nowrap;
      padding: 0 4px;
    }

    /* Dropdown */
    .ft-dropdown {
      position: relative;
    }

    .ft-dropdown__backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .ft-dropdown__panel {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 6px;
      background: #2a2a4a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 4px;
      min-width: 200px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: 200;
    }

    .ft-dropdown__item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 10px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.78rem;
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

    .ft-dropdown__sep {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 3px 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutFloatingToolbarComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly actions = inject(LayoutDesignerActionsService);
  protected readonly ICONS = ICONS;

  readonly linking = input<boolean>(false);

  readonly uploadPhotoClicked = output<void>();
  readonly linkLayersClicked = output<void>();
  readonly unlinkLayersClicked = output<void>();

  readonly moreOpen = signal(false);

  /** Toolbar pozíció (canvas wrapper-hez relatív) */
  readonly position = computed(() => {
    const bounds = this.state.selectionScreenBounds();
    if (!bounds) return null;

    // Fent jelenik meg, ha van hely
    const toolbarY = bounds.top - GAP - TOOLBAR_HEIGHT;
    const below = toolbarY < 0;

    return {
      x: bounds.centerX,
      y: below ? bounds.bottom + GAP : toolbarY,
      below,
    };
  });
}
