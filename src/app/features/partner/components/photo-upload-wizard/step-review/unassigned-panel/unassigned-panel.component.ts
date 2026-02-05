import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  ElementRef,
  inject,
  DestroyRef
} from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { UploadedPhoto } from '../../../../services/partner.service';

/**
 * Párosítatlan képek panel - sticky az alján.
 * Vízszintesen görgethető (egérrel húzható).
 */
@Component({
  selector: 'app-review-unassigned-panel',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, LucideAngularModule],
  templateUrl: './unassigned-panel.component.html',
  styleUrls: ['./unassigned-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewUnassignedPanelComponent {
  readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);

  readonly gridElement = viewChild<ElementRef<HTMLElement>>('gridElement');

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

  constructor() {
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    });
  }

  onDrop(event: CdkDragDrop<any>): void {
    this.drop.emit(event);
  }

  onMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.unassigned-photo')) return;

    const grid = this.gridElement()?.nativeElement;
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

    const grid = this.gridElement()?.nativeElement;
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

    const grid = this.gridElement()?.nativeElement;
    if (grid) {
      grid.style.cursor = 'grab';
    }

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}
