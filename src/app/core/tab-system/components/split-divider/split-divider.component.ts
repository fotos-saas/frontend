import { Component, ChangeDetectionStrategy, input, output, ElementRef, inject, signal } from '@angular/core';
import type { SplitMode } from '../../models/tab.model';

@Component({
  selector: 'app-split-divider',
  standalone: true,
  template: `
    <div class="split-divider"
         [class.horizontal]="mode() === 'horizontal'"
         [class.vertical]="mode() === 'vertical'"
         [class.dragging]="isDragging()"
         role="separator"
         [attr.aria-orientation]="mode() === 'horizontal' ? 'vertical' : 'horizontal'"
         aria-label="Panel meret allitasa"
         tabindex="0"
         (mousedown)="onMouseDown($event)"
         (dblclick)="onDoubleClick()"
         (keydown)="onKeyDown($event)">
      <div class="divider-handle"></div>
    </div>
  `,
  styles: [`
    .split-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 10;
      touch-action: none;

      &.horizontal {
        width: 4px;
        cursor: col-resize;

        &:hover, &.dragging {
          width: 6px;
        }

        .divider-handle {
          width: 2px;
          height: 24px;
          border-radius: 1px;
        }
      }

      &.vertical {
        height: 4px;
        cursor: row-resize;

        &:hover, &.dragging {
          height: 6px;
        }

        .divider-handle {
          height: 2px;
          width: 24px;
          border-radius: 1px;
        }
      }

      background: var(--divider-bg, rgba(0, 0, 0, 0.06));
      transition: background-color 150ms, width 150ms, height 150ms;

      :host-context(.dark) & {
        --divider-bg: rgba(255, 255, 255, 0.08);
        --divider-handle: rgba(255, 255, 255, 0.3);
        --divider-active: #7c3aed;
      }

      &:hover, &.dragging {
        background: var(--divider-active, #7c3aed);
      }

      &:focus-visible {
        outline: 2px solid #7c3aed;
        outline-offset: -2px;
      }
    }

    .divider-handle {
      background: var(--divider-handle, rgba(0, 0, 0, 0.2));
      border-radius: 1px;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .split-divider {
        transition-duration: 0ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitDividerComponent {
  readonly mode = input.required<SplitMode>();
  readonly ratio = input<number>(0.5);
  readonly ratioChange = output<number>();

  private readonly elementRef = inject(ElementRef);
  readonly isDragging = signal(false);

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging.set(true);

    const container = this.elementRef.nativeElement.parentElement;
    if (!container) return;

    const isHorizontal = this.mode() === 'horizontal';
    const containerRect = container.getBoundingClientRect();

    const onMouseMove = (e: MouseEvent) => {
      let newRatio: number;
      if (isHorizontal) {
        newRatio = (e.clientX - containerRect.left) / containerRect.width;
      } else {
        newRatio = (e.clientY - containerRect.top) / containerRect.height;
      }

      // Min/max korlat (20%-80%)
      newRatio = Math.max(0.2, Math.min(0.8, newRatio));
      this.ratioChange.emit(newRatio);
    };

    const onMouseUp = () => {
      this.isDragging.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  onDoubleClick(): void {
    // Visszaallitas 50/50 aranyra
    this.ratioChange.emit(0.5);
  }

  onKeyDown(event: KeyboardEvent): void {
    const step = 0.05;
    const currentRatio = this.ratio();

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.ratioChange.emit(Math.max(0.2, currentRatio - step));
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.ratioChange.emit(Math.min(0.8, currentRatio + step));
        break;
      case 'Home':
        event.preventDefault();
        this.ratioChange.emit(0.5);
        break;
    }
  }
}
