import {
  Component, ChangeDetectionStrategy, input, inject, computed,
  ElementRef, AfterViewInit, DestroyRef,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DesignerLayer } from '../../layout-designer.types';
import { LayoutDesignerDragService } from '../../layout-designer-drag.service';
import { LayoutDesignerSwapService } from '../../layout-designer-swap.service';

@Component({
  selector: 'app-layout-layer',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div
      class="designer-layer"
      [class.designer-layer--selected]="isSelected()"
      [class.designer-layer--image]="isImage()"
      [class.designer-layer--text]="isText()"
      [class.designer-layer--fixed]="layer().category === 'fixed'"
      [class.designer-layer--swap-target]="isSwapTarget()"
      [class.designer-layer--dragging]="isDragging()"
      [style.left.px]="displayX()"
      [style.top.px]="displayY()"
      [style.width.px]="displayWidth()"
      [style.height.px]="isText() ? null : displayHeight()"
      (mousedown)="onMouseDown($event)"
    >
      @if (isImage()) {
        @if (layer().personMatch?.photoThumbUrl) {
          <img
            class="designer-layer__thumb"
            [src]="layer().personMatch!.photoThumbUrl"
            [alt]="layer().layerName"
            draggable="false"
          />
        } @else {
          <div class="designer-layer__placeholder">
            <lucide-icon [name]="ICONS.USER" [size]="placeholderIconSize()" />
          </div>
        }
        @if (layer().linked === true) {
          <div class="designer-layer__linked-badge">
            <lucide-icon [name]="ICONS.LINK" [size]="10" />
          </div>
        }
      } @else if (isText()) {
        <div
          class="designer-layer__text"
          [class.designer-layer__text--position]="isPosition()"
          [style.font-size.px]="textFontSize()"
        >
          @for (line of textLines(); track $index) {
            <div class="designer-layer__text-line">{{ line }}</div>
          }
        </div>
      } @else {
        <div class="designer-layer__fixed">
          <lucide-icon [name]="ICONS.LAYERS" [size]="12" />
          <span>{{ layer().layerName }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .designer-layer {
      position: absolute;
      cursor: grab;
      border: 1px solid transparent;
      border-radius: 3px;
      transition: border-color 0.1s ease, box-shadow 0.1s ease;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      box-sizing: border-box;

      &:hover { border-color: rgba(124, 58, 237, 0.4); }

      &--selected {
        border-color: #7c3aed !important;
        box-shadow: 0 0 0 1px #7c3aed;
        z-index: 10;
      }

      &--image {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.9);
      }

      &--text {
        background: transparent;
        border: none !important;
        box-shadow: none !important;
        overflow: visible;
      }

      &--fixed {
        background: rgba(156, 163, 175, 0.15);
        border-color: rgba(156, 163, 175, 0.3);
        pointer-events: none;
      }

      &--swap-target {
        border-color: #eab308 !important;
        box-shadow: 0 0 0 2px #eab308, 0 0 12px rgba(234, 179, 8, 0.4);
        z-index: 50;
      }

      &--dragging {
        z-index: 100;
      }

      &:active { cursor: grabbing; }
    }

    .designer-layer__thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 2px;
      pointer-events: none;
    }

    .designer-layer__placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      color: #9ca3af;
      border-radius: 2px;
    }

    .designer-layer__text {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #1e293b;
      line-height: 1.2;
    }

    .designer-layer__text--position {
      color: #64748b;
      font-style: italic;
    }

    .designer-layer__text-line {
      white-space: nowrap;
    }

    .designer-layer__linked-badge {
      position: absolute;
      bottom: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      background: rgba(34, 197, 94, 0.85);
      color: #ffffff;
    }

    .designer-layer__fixed {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 4px;
      font-size: 9px;
      color: #6b7280;
      overflow: hidden;
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutLayerComponent implements AfterViewInit {
  private readonly dragService = inject(LayoutDesignerDragService);
  private readonly swapService = inject(LayoutDesignerSwapService);
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  readonly layer = input.required<DesignerLayer>();
  readonly scale = input.required<number>();
  readonly isSelected = input<boolean>(false);

  /** Swap cél: sárga kerettel jelölt elem (bármely swap pár target-je) */
  readonly isSwapTarget = computed(() => {
    const candidate = this.swapService.swapCandidate();
    if (!candidate) return false;
    const id = this.layer().layerId;
    return candidate.pairs.some(p => p.targetLayerId === id);
  });

  /** Drag közben: az elem vizuálisan a fogott csoportban van */
  readonly isDragging = computed(() => {
    const ds = this.dragService.dragState();
    return ds?.active === true && this.isSelected();
  });

  /** Megjelenítendő szöveg: position → text mező, név → person match neve, egyéb → layerName */
  readonly displayName = computed(() => {
    const l = this.layer();
    if (this.isPosition()) return l.text || l.layerName;
    return l.personMatch?.name ?? l.layerName;
  });

  /** Szöveg sorok: 3+ névrésznél (kötőjel is számít) a 2. névrész után tör */
  readonly textLines = computed(() => {
    const name = this.displayName();
    const words = name.split(' ');

    const totalParts = words.reduce((sum, w) => sum + w.split('-').length, 0);
    if (totalParts < 3) return [name];

    let running = 0;
    for (let i = 0; i < words.length; i++) {
      running += words[i].split('-').length;
      if (running >= 2) {
        return [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')];
      }
    }

    return [name];
  });

  readonly isImage = computed(() => {
    const cat = this.layer().category;
    return cat === 'student-image' || cat === 'teacher-image';
  });

  readonly isText = computed(() => {
    const cat = this.layer().category;
    return cat === 'student-name' || cat === 'teacher-name'
      || cat === 'student-position' || cat === 'teacher-position';
  });

  readonly isPosition = computed(() => {
    const cat = this.layer().category;
    return cat === 'student-position' || cat === 'teacher-position';
  });

  readonly displayX = computed(() => {
    const l = this.layer();
    return (l.editedX ?? l.x) * this.scale();
  });

  readonly displayY = computed(() => {
    const l = this.layer();
    return (l.editedY ?? l.y) * this.scale();
  });

  readonly displayWidth = computed(() =>
    this.layer().width * this.scale(),
  );

  readonly displayHeight = computed(() =>
    this.layer().height * this.scale(),
  );

  readonly placeholderIconSize = computed(() =>
    Math.max(12, Math.min(24, this.displayWidth() * 0.4)),
  );

  /**
   * Szöveg méret: fix PSD-beli font magasság × scale.
   * NEM a layer height-ból (az inconsistent a sortörés miatt),
   * hanem konstans értékből: név ~40px, pozíció ~28px a PSD-ben.
   */
  readonly textFontSize = computed(() => {
    const basePsdPx = this.isPosition() ? 38 : 55;
    return Math.max(4, basePsdPx * this.scale());
  });

  ngAfterViewInit(): void {
    // DOM elem regisztrálása a drag service-ben
    const hostEl = this.el.nativeElement as HTMLElement;
    const layerEl = hostEl.firstElementChild as HTMLElement;
    if (layerEl) {
      this.dragService.registerLayerElement(this.layer().layerId, layerEl);
    }

    this.destroyRef.onDestroy(() => {
      this.dragService.unregisterLayerElement(this.layer().layerId);
    });
  }

  onMouseDown(event: MouseEvent): void {
    // Fixed layerek nem mozgathatók
    if (this.layer().category === 'fixed') return;

    this.dragService.startDrag(this.layer().layerId, event, this.scale());
  }
}
