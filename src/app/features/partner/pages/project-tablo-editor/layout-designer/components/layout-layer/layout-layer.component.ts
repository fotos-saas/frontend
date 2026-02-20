import {
  Component, ChangeDetectionStrategy, input, output, inject,
} from '@angular/core';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DesignerLayer } from '../../layout-designer.types';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';

@Component({
  selector: 'app-layout-layer',
  standalone: true,
  imports: [CdkDrag, LucideAngularModule],
  template: `
    <div
      class="designer-layer"
      [class.designer-layer--selected]="isSelected()"
      [class.designer-layer--image]="isImage"
      [class.designer-layer--text]="isText"
      [class.designer-layer--fixed]="layer().category === 'fixed'"
      [style.left.px]="displayX"
      [style.top.px]="displayY"
      [style.width.px]="displayWidth"
      [style.height.px]="isText ? null : displayHeight"
      cdkDrag
      [cdkDragFreeDragPosition]="{ x: 0, y: 0 }"
      (cdkDragEnded)="onDragEnd($event)"
      (click)="onClick($event)"
    >
      @if (isImage) {
        @if (layer().personMatch?.photoThumbUrl) {
          <img
            class="designer-layer__thumb"
            [src]="layer().personMatch!.photoThumbUrl"
            [alt]="layer().layerName"
            draggable="false"
          />
        } @else {
          <div class="designer-layer__placeholder">
            <lucide-icon [name]="ICONS.USER" [size]="placeholderIconSize" />
          </div>
        }
      } @else if (isText) {
        <div class="designer-layer__text">
          @for (line of textLines; track $index) {
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
      font-size: 10px;
      line-height: 1.2;
    }

    .designer-layer__text-line {
      white-space: nowrap;
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
export class LayoutLayerComponent {
  private readonly state = inject(LayoutDesignerStateService);
  protected readonly ICONS = ICONS;

  readonly layer = input.required<DesignerLayer>();
  readonly scale = input.required<number>();
  readonly isSelected = input<boolean>(false);

  readonly layerClicked = output<{ layerId: number; additive: boolean }>();

  /** Megjelenítendő név: person match neve, vagy layerName fallback */
  get displayName(): string {
    return this.layer().personMatch?.name ?? this.layer().layerName;
  }

  /** Szöveg sorok: 3+ névrésznél (kötőjel is számít) a 2. névrész után tör */
  get textLines(): string[] {
    const name = this.displayName;
    const words = name.split(' ');

    // Összes névrész: szóköz ÉS kötőjel mentén
    const totalParts = words.reduce((sum, w) => sum + w.split('-').length, 0);
    if (totalParts < 3) return [name];

    // Törés: az első szóköz-szó után ahol a futó névrész-szám eléri a 2-t
    let running = 0;
    for (let i = 0; i < words.length; i++) {
      running += words[i].split('-').length;
      if (running >= 2) {
        return [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')];
      }
    }

    return [name];
  }

  get isImage(): boolean {
    const cat = this.layer().category;
    return cat === 'student-image' || cat === 'teacher-image';
  }

  get isText(): boolean {
    const cat = this.layer().category;
    return cat === 'student-name' || cat === 'teacher-name';
  }

  get displayX(): number {
    const l = this.layer();
    return (l.editedX ?? l.x) * this.scale();
  }

  get displayY(): number {
    const l = this.layer();
    return (l.editedY ?? l.y) * this.scale();
  }

  get displayWidth(): number {
    return this.layer().width * this.scale();
  }

  get displayHeight(): number {
    return this.layer().height * this.scale();
  }

  get placeholderIconSize(): number {
    return Math.max(12, Math.min(24, this.displayWidth * 0.4));
  }

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.layerClicked.emit({
      layerId: this.layer().layerId,
      additive: event.metaKey || event.ctrlKey,
    });
  }

  onDragEnd(event: CdkDragEnd): void {
    const s = this.scale();
    if (s === 0) return;

    const deltaXPsd = Math.round(event.distance.x / s);
    const deltaYPsd = Math.round(event.distance.y / s);

    if (deltaXPsd !== 0 || deltaYPsd !== 0) {
      this.state.moveSelectedLayers(deltaXPsd, deltaYPsd);
    }

    // CDK transform reset — a pozíciót a signal vezérli
    event.source.reset();
  }
}
