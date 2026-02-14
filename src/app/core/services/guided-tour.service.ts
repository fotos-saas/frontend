import { Injectable, signal, computed } from '@angular/core';
import { Tour, TourStep, SpotlightRect } from '../../shared/components/guided-tour/guided-tour.types';
import { getSpotlightRect } from '../../shared/components/guided-tour/guided-tour-position.util';
import { filterTourSteps, calculateMaxVersion } from '../../shared/components/guided-tour/guided-tour-filter.util';

const OLD_STORAGE_KEY = 'guided_tours_completed';
const STORAGE_KEY = 'guided_tour_versions';

@Injectable({ providedIn: 'root' })
export class GuidedTourService {
  private readonly _isActive = signal(false);
  private readonly _currentTour = signal<Tour | null>(null);
  private readonly _currentStepIndex = signal(0);
  private readonly _activeSteps = signal<TourStep[]>([]);
  private readonly _targetElement = signal<HTMLElement | null>(null);
  private readonly _targetRect = signal<SpotlightRect | null>(null);
  private readonly _isTransitioning = signal(false);

  readonly isActive = this._isActive.asReadonly();
  readonly currentTour = this._currentTour.asReadonly();
  readonly currentStepIndex = this._currentStepIndex.asReadonly();
  readonly targetElement = this._targetElement.asReadonly();
  readonly targetRect = this._targetRect.asReadonly();
  readonly isTransitioning = this._isTransitioning.asReadonly();

  readonly currentStep = computed<TourStep | null>(() => {
    const steps = this._activeSteps();
    const index = this._currentStepIndex();
    return steps[index] ?? null;
  });

  readonly totalSteps = computed(() => this._activeSteps().length);
  readonly isFirstStep = computed(() => this._currentStepIndex() === 0);
  readonly isLastStep = computed(() => this._currentStepIndex() === this.totalSteps() - 1);
  readonly stepCounter = computed(() => `${this._currentStepIndex() + 1}/${this.totalSteps()}`);

  start(tour: Tour): void {
    this.migrateOldStorage();
    const filtered = filterTourSteps(tour.steps, { lastVersion: 0, isManual: true });
    if (filtered.length === 0) return;

    this._currentTour.set(tour);
    this._activeSteps.set(filtered);
    this._currentStepIndex.set(0);
    this._isActive.set(true);
    this.resolveTargetElement();
  }

  startIfNeeded(tour: Tour): void {
    this.migrateOldStorage();
    const maxVersion = calculateMaxVersion(tour.steps);
    const seenVersion = this.getSeenVersion(tour.id);

    if (seenVersion >= maxVersion) return;
    if (tour.autoStart === false) return;

    const filtered = filterTourSteps(tour.steps, { lastVersion: seenVersion, isManual: false });
    if (filtered.length === 0) return;

    this._currentTour.set(tour);
    this._activeSteps.set(filtered);
    this._currentStepIndex.set(0);
    this._isActive.set(true);
    this.resolveTargetElement();
  }

  next(): void {
    if (this.isLastStep()) {
      this.complete();
      return;
    }
    this._isTransitioning.set(true);
    setTimeout(() => {
      this._currentStepIndex.update(i => i + 1);
      this.resolveTargetElement();
      this._isTransitioning.set(false);
    }, 200);
  }

  prev(): void {
    if (this.isFirstStep()) return;
    this._isTransitioning.set(true);
    setTimeout(() => {
      this._currentStepIndex.update(i => i - 1);
      this.resolveTargetElement();
      this._isTransitioning.set(false);
    }, 200);
  }

  skip(): void {
    this.markCompleted();
    this.reset();
  }

  recalculateRect(): void {
    const el = this._targetElement();
    if (el) {
      const step = this.currentStep();
      const padding = step?.spotlightPadding ?? 8;
      this._targetRect.set(getSpotlightRect(el.getBoundingClientRect(), padding));
    } else {
      this._targetRect.set(null);
    }
  }

  private complete(): void {
    this.markCompleted();
    this.reset();
  }

  private reset(): void {
    this._isActive.set(false);
    this._currentTour.set(null);
    this._activeSteps.set([]);
    this._currentStepIndex.set(0);
    this._targetElement.set(null);
    this._targetRect.set(null);
    this._isTransitioning.set(false);
  }

  private resolveTargetElement(): void {
    const step = this.currentStep();
    if (!step?.targetSelector) {
      this._targetElement.set(null);
      this._targetRect.set(null);
      return;
    }

    const el = document.querySelector<HTMLElement>(step.targetSelector);
    if (!el) {
      this._targetElement.set(null);
      this._targetRect.set(null);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this._targetElement.set(el);

    requestAnimationFrame(() => {
      const padding = step.spotlightPadding ?? 8;
      this._targetRect.set(getSpotlightRect(el.getBoundingClientRect(), padding));
    });
  }

  private getSeenVersion(tourId: string): number {
    const versions = this.getVersionMap();
    return versions[tourId] ?? 0;
  }

  private markCompleted(): void {
    const tour = this._currentTour();
    if (!tour) return;
    const maxVersion = calculateMaxVersion(tour.steps);
    const versions = this.getVersionMap();
    versions[tour.id] = maxVersion;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  }

  private getVersionMap(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private migrateOldStorage(): void {
    try {
      const old = localStorage.getItem(OLD_STORAGE_KEY);
      if (!old) return;

      const parsed = JSON.parse(old);
      if (!Array.isArray(parsed)) return;

      const versions = this.getVersionMap();
      for (const tourId of parsed) {
        if (typeof tourId === 'string' && !(tourId in versions)) {
          versions[tourId] = 1;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
      localStorage.removeItem(OLD_STORAGE_KEY);
    } catch {
      // Hibás régi adat — töröljük
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  }
}
