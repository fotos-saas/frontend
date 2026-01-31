import { Injectable, signal } from '@angular/core';

/**
 * DragScrollService - Drag scroll + momentum kezelése
 *
 * Újrafelhasználható service húzható scroll-hoz:
 * - 1:1 arányú drag scroll
 * - Momentum effekt (jégen csúszás)
 * - Touch támogatás
 */
@Injectable()
export class DragScrollService {
  /** Is currently dragging */
  readonly isDragging = signal<boolean>(false);

  /** Drag state */
  private dragStartX = 0;
  private dragScrollLeft = 0;
  private dragLastX = 0;
  private dragVelocity = 0;
  private dragLastTime = 0;

  /** Momentum animation */
  private momentumAnimationId: number | null = null;

  /** Target element */
  private element: HTMLElement | null = null;

  /**
   * Set target element
   */
  setElement(element: HTMLElement): void {
    this.element = element;
  }

  /**
   * Handle mouse down event
   */
  onMouseDown(event: MouseEvent): void {
    if (!this.element) return;

    this.cancelMomentum();

    this.isDragging.set(true);
    this.dragStartX = event.pageX;
    this.dragLastX = event.pageX;
    this.dragScrollLeft = this.element.scrollLeft;
    this.dragVelocity = 0;
    this.dragLastTime = Date.now();
    this.element.style.cursor = 'grabbing';
  }

  /**
   * Handle mouse move event
   * 1:1 scroll ratio
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging() || !this.element) return;

    event.preventDefault();

    const now = Date.now();
    const deltaTime = now - this.dragLastTime;
    const deltaX = event.pageX - this.dragLastX;

    // 1:1 scroll
    const walk = event.pageX - this.dragStartX;
    this.element.scrollLeft = this.dragScrollLeft - walk;

    // Calculate velocity for momentum
    if (deltaTime > 0) {
      this.dragVelocity = deltaX / deltaTime;
    }

    this.dragLastX = event.pageX;
    this.dragLastTime = now;
  }

  /**
   * Handle mouse up / mouse leave
   * Starts momentum if fast enough
   */
  onMouseUp(): void {
    if (!this.element) return;

    this.isDragging.set(false);
    this.element.style.cursor = 'grab';

    // Start momentum if fast
    const velocityThreshold = 0.3; // px/ms
    if (Math.abs(this.dragVelocity) > velocityThreshold) {
      this.startMomentumScroll();
    }
  }

  /**
   * Handle touch start
   */
  onTouchStart(event: TouchEvent): void {
    if (!this.element) return;

    this.cancelMomentum();

    this.isDragging.set(true);
    this.dragStartX = event.touches[0].pageX;
    this.dragLastX = event.touches[0].pageX;
    this.dragScrollLeft = this.element.scrollLeft;
    this.dragVelocity = 0;
    this.dragLastTime = Date.now();
  }

  /**
   * Handle touch move
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging() || !this.element) return;

    const now = Date.now();
    const deltaTime = now - this.dragLastTime;
    const currentX = event.touches[0].pageX;
    const deltaX = currentX - this.dragLastX;

    // 1:1 scroll
    const walk = currentX - this.dragStartX;
    this.element.scrollLeft = this.dragScrollLeft - walk;

    // Calculate velocity
    if (deltaTime > 0) {
      this.dragVelocity = deltaX / deltaTime;
    }

    this.dragLastX = currentX;
    this.dragLastTime = now;
  }

  /**
   * Handle touch end
   */
  onTouchEnd(): void {
    this.isDragging.set(false);

    // Start momentum if fast
    const velocityThreshold = 0.3;
    if (Math.abs(this.dragVelocity) > velocityThreshold) {
      this.startMomentumScroll();
    }
  }

  /**
   * Start momentum scroll animation
   */
  private startMomentumScroll(): void {
    if (!this.element) return;

    const friction = 0.95;
    let velocity = this.dragVelocity * 15;
    const element = this.element;

    const animate = () => {
      if (Math.abs(velocity) < 0.5) {
        this.momentumAnimationId = null;
        return;
      }

      element.scrollLeft -= velocity;
      velocity *= friction;

      this.momentumAnimationId = requestAnimationFrame(animate);
    };

    this.momentumAnimationId = requestAnimationFrame(animate);
  }

  /**
   * Cancel momentum animation
   */
  cancelMomentum(): void {
    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
      this.momentumAnimationId = null;
    }
  }

  /**
   * Auto-scroll to center an item
   * @param itemIndex Index of the item
   * @param itemWidth Width of each item (including margins)
   */
  scrollToItem(itemIndex: number, itemWidth: number): void {
    if (!this.element) return;

    const galleryWidth = this.element.clientWidth;
    const itemLeft = itemIndex * itemWidth;
    const itemCenter = itemLeft + (itemWidth / 2);
    const scrollTarget = itemCenter - (galleryWidth / 2);

    this.element.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: 'smooth'
    });
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.cancelMomentum();
    this.element = null;
  }
}
