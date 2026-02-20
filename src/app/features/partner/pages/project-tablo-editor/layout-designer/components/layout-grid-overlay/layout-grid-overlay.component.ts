import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LayoutDesignerGridService } from '../../layout-designer-grid.service';
import { LayoutDesignerDragService } from '../../layout-designer-drag.service';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { GroupGridConfig } from '../../layout-designer.types';

interface GridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * SVG grid overlay a layout canvas-en.
 * Diák cellák: halvány lila, Tanár cellák: halvány sárga.
 * Ha grid ki van kapcsolva de drag aktív → ideiglenesen megjelenik.
 */
@Component({
  selector: 'app-layout-grid-overlay',
  standalone: true,
  template: `
    @if (visible()) {
      <svg
        class="grid-overlay"
        [attr.width]="displayWidth()"
        [attr.height]="displayHeight()"
      >
        <!-- Diák grid — lila -->
        @for (rect of studentRects(); track $index) {
          <rect
            [attr.x]="rect.x"
            [attr.y]="rect.y"
            [attr.width]="rect.width"
            [attr.height]="rect.height"
            class="grid-cell grid-cell--student"
          />
        }
        <!-- Tanár grid — sárga -->
        @for (rect of teacherRects(); track $index) {
          <rect
            [attr.x]="rect.x"
            [attr.y]="rect.y"
            [attr.width]="rect.width"
            [attr.height]="rect.height"
            class="grid-cell grid-cell--teacher"
          />
        }
      </svg>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    }

    .grid-cell {
      fill: none;
      stroke-width: 1;
      stroke-dasharray: 4 3;

      &--student {
        stroke: rgba(124, 58, 237, 0.3);
      }

      &--teacher {
        stroke: rgba(234, 179, 8, 0.35);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutGridOverlayComponent {
  private readonly gridService = inject(LayoutDesignerGridService);
  private readonly dragService = inject(LayoutDesignerDragService);
  private readonly state = inject(LayoutDesignerStateService);

  /** Canvas display méret */
  readonly displayWidth = computed(() => this.state.scaleInfo().displayWidth);
  readonly displayHeight = computed(() => this.state.scaleInfo().displayHeight);

  /** Láthatóság: grid enabled VAGY drag aktív */
  readonly visible = computed(() => {
    return this.gridService.gridEnabled() || this.dragService.dragState()?.active === true;
  });

  /** Drag közben mindkét grid látható (ideiglenesen) */
  private readonly isDragging = computed(() => this.dragService.dragState()?.active === true);

  /** Diák cellák display koordinátákban (mód vagy drag alapján) */
  readonly studentRects = computed(() => {
    if (!this.gridService.showStudentGrid() && !this.isDragging()) return [];
    const grid = this.gridService.studentGrid();
    return grid ? this.gridToRects(grid) : [];
  });

  /** Tanár cellák display koordinátákban (mód vagy drag alapján) */
  readonly teacherRects = computed(() => {
    if (!this.gridService.showTeacherGrid() && !this.isDragging()) return [];
    const grid = this.gridService.teacherGrid();
    return grid ? this.gridToRects(grid) : [];
  });

  /** Grid konfiguráció → SVG rect-ek (display koordinátákban) */
  private gridToRects(grid: GroupGridConfig): GridRect[] {
    const scale = this.state.scaleInfo().scale;
    const rects: GridRect[] = [];

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        rects.push({
          x: (grid.originX + col * grid.cellWidth) * scale,
          y: (grid.originY + row * grid.cellHeight) * scale,
          width: grid.imageWidth * scale,
          height: grid.imageHeight * scale,
        });
      }
    }

    return rects;
  }
}
