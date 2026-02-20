import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutLayerComponent } from '../layout-layer/layout-layer.component';
import { LayoutGridOverlayComponent } from '../layout-grid-overlay/layout-grid-overlay.component';

/**
 * Layout Canvas — arányos konténer, benne a layerek.
 * A PSD dokumentumot szimulálja fehér háttérrel.
 */
@Component({
  selector: 'app-layout-canvas',
  standalone: true,
  imports: [LayoutLayerComponent, LayoutGridOverlayComponent],
  template: `
    <div
      class="layout-canvas-wrapper"
      (click)="onCanvasClick($event)"
    >
      <div
        class="layout-canvas"
        [style.width.px]="scaleInfo().displayWidth"
        [style.height.px]="scaleInfo().displayHeight"
        [style.left.px]="scaleInfo().offsetX"
        [style.top.px]="canvasTop()"
      >
        <app-layout-grid-overlay />
        @for (layer of state.layers(); track layer.layerId) {
          <app-layout-layer
            [layer]="layer"
            [scale]="scaleInfo().scale"
            [isSelected]="isLayerSelected(layer.layerId)"
          />
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .layout-canvas-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .layout-canvas {
      position: absolute;
      background: #ffffff;
      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutCanvasComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly scaleInfo = this.state.scaleInfo;

  /** Canvas top pozíció (toolbar nélkül — a toolbar a parent-ben van) */
  readonly canvasTop = computed(() => {
    const si = this.scaleInfo();
    return si.offsetY - 56;
  });

  isLayerSelected(layerId: number): boolean {
    return this.state.selectedLayerIds().has(layerId);
  }

  onCanvasClick(event: MouseEvent): void {
    if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains('layout-canvas')) {
      this.state.clearSelection();
    }
  }
}
