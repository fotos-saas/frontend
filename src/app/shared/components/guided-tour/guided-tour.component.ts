import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  signal,
  computed,
  DestroyRef,
  NgZone,
  HostListener,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { GuidedTourService } from '../../../core/services/guided-tour.service';
import { GuidedTourTooltipComponent } from './guided-tour-tooltip.component';
import { calculateTooltipPosition } from './guided-tour-position.util';
import { TooltipPosition } from './guided-tour.types';

@Component({
  selector: 'app-guided-tour',
  standalone: true,
  imports: [GuidedTourTooltipComponent],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidedTourComponent {
  readonly tourService = inject(GuidedTourService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elRef = inject(ElementRef);

  readonly tooltipPosition = signal<TooltipPosition>({ top: 0, left: 0, arrowPosition: 'none' });
  readonly tooltipVisible = signal(false);

  readonly viewBox = computed(() => `0 0 ${this.vpWidth()} ${this.vpHeight()}`);
  private readonly vpWidth = signal(window.innerWidth);
  private readonly vpHeight = signal(window.innerHeight);

  readonly progressPercent = computed(() => {
    const total = this.tourService.totalSteps();
    if (total === 0) return 0;
    return ((this.tourService.currentStepIndex() + 1) / total) * 100;
  });

  private resizeCleanup: (() => void) | null = null;
  private scrollCleanup: (() => void) | null = null;

  constructor() {
    // Recalculate tooltip position when step changes
    effect(() => {
      const step = this.tourService.currentStep();
      const rect = this.tourService.targetRect();
      if (!step) return;

      const placement = step.placement ?? 'bottom';
      this.tooltipVisible.set(false);

      requestAnimationFrame(() => {
        this.tooltipPosition.set(calculateTooltipPosition(rect, placement));
        this.tooltipVisible.set(true);
      });
    });

    // Viewport resize listeners (outside Angular zone)
    afterNextRender(() => {
      this.ngZone.runOutsideAngular(() => {
        let resizeTimer: ReturnType<typeof setTimeout>;
        const onResize = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            this.vpWidth.set(window.innerWidth);
            this.vpHeight.set(window.innerHeight);
            this.tourService.recalculateRect();
          }, 50);
        };

        let scrollTimer: ReturnType<typeof setTimeout>;
        const onScroll = () => {
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            this.tourService.recalculateRect();
          }, 50);
        };

        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('scroll', onScroll, { capture: true, passive: true });

        this.resizeCleanup = () => window.removeEventListener('resize', onResize);
        this.scrollCleanup = () => {
          window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
        };
      });

      this.destroyRef.onDestroy(() => {
        this.resizeCleanup?.();
        this.scrollCleanup?.();
      });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.tourService.isActive()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.tourService.skip();
        break;
      case 'Enter':
      case 'ArrowRight':
        event.preventDefault();
        this.tourService.next();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.tourService.prev();
        break;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    // Only skip if clicking the overlay itself (not tooltip)
    if (event.target === this.elRef.nativeElement.querySelector('.gt-overlay__svg')) {
      this.tourService.skip();
    }
  }
}
