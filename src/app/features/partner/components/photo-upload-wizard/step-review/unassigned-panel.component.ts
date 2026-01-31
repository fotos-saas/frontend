import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { UploadedPhoto } from '../../../services/partner.service';

/**
 * Párosítatlan képek panel - sticky az alján.
 * Vízszintesen görgethető (egérrel húzható).
 */
@Component({
  selector: 'app-review-unassigned-panel',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, LucideAngularModule],
  template: `
    <div class="unassigned-section">
      <div class="unassigned-header">
        <h4>
          <lucide-icon [name]="ICONS.IMAGE" [size]="16" />
          Párosítatlan képek ({{ photos().length }})
        </h4>
        <button
          class="delete-unassigned-btn"
          (click)="deleteAll.emit()"
          data-tooltip="Összes párosítatlan kép törlése"
        >
          <lucide-icon [name]="ICONS.DELETE" [size]="14" />
          Törlés
        </button>
      </div>
      <div
        #gridElement
        class="unassigned-grid"
        cdkDropList
        [cdkDropListData]="photos()"
        [cdkDropListConnectedTo]="connectedDropLists()"
        (cdkDropListDropped)="onDrop($event)"
        id="unassigned-list"
        (mousedown)="onMouseDown($event)"
      >
        @for (photo of photos(); track photo.mediaId; let i = $index) {
          <div
            class="unassigned-photo"
            [style.animation-delay]="i * 0.02 + 's'"
            cdkDrag
            [cdkDragData]="photo"
          >
            <img
              [src]="photo.thumbUrl"
              [alt]="photo.iptcTitle || photo.filename"
              [matTooltip]="photo.iptcTitle || photo.filename"
              matTooltipPosition="above"
              [matTooltipShowDelay]="0"
              (click)="photoClick.emit(photo); $event.stopPropagation()"
            />
            <div
              class="unassigned-name"
              [matTooltip]="photo.iptcTitle || photo.filename"
              matTooltipPosition="below"
              [matTooltipShowDelay]="0"
            >
              {{ photo.iptcTitle || photo.filename }}
            </div>
            <img *cdkDragPreview [src]="photo.thumbUrl" class="drag-preview-img" />
            <div *cdkDragPlaceholder class="drag-placeholder"></div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .unassigned-section {
      position: sticky;
      bottom: -24px;
      z-index: 10;
      background: #fffbeb;
      border-top: 2px solid #fde68a;
      padding: 10px 24px;
      padding-top: 42px;
      margin: 0 -24px -24px -24px;
      margin-top: -32px;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
    }

    .unassigned-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      overflow: visible;
    }

    .unassigned-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }

    .delete-unassigned-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #dc2626;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .delete-unassigned-btn:hover {
      background: #fee2e2;
      border-color: #f87171;
    }

    .unassigned-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 6px;
      overflow-x: auto;
      overflow-y: visible;
      padding-bottom: 8px;
      -webkit-overflow-scrolling: touch;
      cursor: grab;
      user-select: none;
    }

    .unassigned-grid::-webkit-scrollbar {
      height: 6px;
    }

    .unassigned-grid::-webkit-scrollbar-track {
      background: #fef3c7;
      border-radius: 3px;
    }

    .unassigned-grid::-webkit-scrollbar-thumb {
      background: #f59e0b;
      border-radius: 3px;
    }

    .unassigned-grid::-webkit-scrollbar-thumb:hover {
      background: #d97706;
    }

    .unassigned-photo {
      flex-shrink: 0;
      width: 72px;
      background: #ffffff;
      border: 2px solid #fde68a;
      border-radius: 6px;
      cursor: grab;
      transition: all 0.15s ease;
      animation: unassignedFadeIn 0.3s ease forwards;
      opacity: 0;
    }

    @keyframes unassignedFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .unassigned-photo:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      border-color: #f59e0b;
    }

    .unassigned-photo:active {
      cursor: grabbing;
    }

    .unassigned-photo img {
      width: 100%;
      height: 72px;
      object-fit: cover;
      object-position: top;
      display: block;
      border-radius: 4px 4px 0 0;
    }

    .unassigned-name {
      padding: 4px 6px;
      font-size: 0.625rem;
      background: #1e293b;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    .drag-preview-img {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
      object-position: top;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      border: 2px solid #ffffff;
    }

    .drag-placeholder {
      display: none !important;
    }

    @media (max-width: 480px) {
      .unassigned-section {
        padding: 8px 16px;
        margin: 0 -16px -16px -16px;
      }

      .unassigned-photo {
        width: 60px;
      }

      .unassigned-photo img {
        height: 60px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewUnassignedPanelComponent implements OnDestroy {
  readonly ICONS = ICONS;

  @ViewChild('gridElement') gridElement!: ElementRef<HTMLElement>;

  readonly photos = input.required<UploadedPhoto[]>();
  readonly connectedDropLists = input<string[]>([]);

  readonly photoClick = output<UploadedPhoto>();
  readonly deleteAll = output<void>();
  readonly drop = output<CdkDragDrop<any>>();

  // Drag scroll state
  private isDraggingScroll = false;
  private isScrollReady = false;
  private scrollStartX = 0;
  private scrollStartY = 0;
  private scrollLeft = 0;

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onDrop(event: CdkDragDrop<any>): void {
    this.drop.emit(event);
  }

  onMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.unassigned-photo')) return;

    const grid = this.gridElement?.nativeElement;
    if (!grid) return;

    this.isScrollReady = true;
    this.isDraggingScroll = false;
    this.scrollStartX = e.pageX;
    this.scrollStartY = e.pageY;
    this.scrollLeft = grid.scrollLeft;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isScrollReady) return;

    const grid = this.gridElement?.nativeElement;
    if (!grid) return;

    const deltaX = Math.abs(e.pageX - this.scrollStartX);
    const deltaY = Math.abs(e.pageY - this.scrollStartY);

    if (deltaY > deltaX && deltaY > 5) {
      this.cancelDragScroll();
      return;
    }

    if (!this.isDraggingScroll && deltaX > 8) {
      this.isDraggingScroll = true;
      grid.style.cursor = 'grabbing';
    }

    if (this.isDraggingScroll) {
      e.preventDefault();
      const walk = (e.pageX - this.scrollStartX) * 1.5;
      grid.scrollLeft = this.scrollLeft - walk;
    }
  };

  private onMouseUp = (): void => {
    this.cancelDragScroll();
  };

  private cancelDragScroll(): void {
    this.isDraggingScroll = false;
    this.isScrollReady = false;

    const grid = this.gridElement?.nativeElement;
    if (grid) {
      grid.style.cursor = 'grab';
    }

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}
