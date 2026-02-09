import {
  Component, ChangeDetectionStrategy, inject, signal, effect, computed,
  DestroyRef, ElementRef, AfterViewChecked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HelpTourService, TourStep } from '../../services/help-tour.service';
import { TourStepTooltipComponent } from '../tour-step-tooltip/tour-step-tooltip.component';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  imports: [TourStepTooltipComponent],
  templateUrl: './tour-overlay.component.html',
  styleUrl: './tour-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourOverlayComponent implements AfterViewChecked {
  protected tourService = inject(HelpTourService);
  private destroyRef = inject(DestroyRef);

  readonly spotlightRect = signal<SpotlightRect | null>(null);
  readonly tooltipPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  readonly isActive = this.tourService.isActive;
  readonly currentStep = this.tourService.currentStep;
  readonly currentStepIndex = this.tourService.currentStepIndex;
  readonly totalSteps = this.tourService.totalSteps;

  constructor() {
    fromEvent(window, 'resize').pipe(
      debounceTime(200),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.updateSpotlight());

    effect(() => {
      const step = this.currentStep();
      if (step) {
        this.updateSpotlight();
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.isActive() && this.currentStep()) {
      this.updateSpotlight();
    }
  }

  private updateSpotlight(): void {
    const step = this.currentStep();
    if (!step?.target_selector) {
      this.spotlightRect.set(null);
      this.tooltipPosition.set({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150 });
      return;
    }

    const el = document.querySelector(step.target_selector);
    if (!el) {
      this.spotlightRect.set(null);
      this.tooltipPosition.set({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150 });
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const padding = 8;
      this.spotlightRect.set({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
      this.calculateTooltipPosition(rect, step.placement);
    }, 300);
  }

  private calculateTooltipPosition(rect: DOMRect, placement: string): void {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const gap = 16;

    let top: number;
    let left: number;

    switch (placement) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
      default: // bottom
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Clamp to viewport
    top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

    this.tooltipPosition.set({ top, left });
  }
}
