import { TourStep } from './guided-tour.types';

interface FilterOptions {
  lastVersion: number;
  isManual: boolean;
}

export function filterTourSteps(steps: TourStep[], options: FilterOptions): TourStep[] {
  const { lastVersion, isManual } = options;

  const normal: TourStep[] = [];
  const outro: TourStep[] = [];

  for (const step of steps) {
    const version = step.since ?? 1;
    const selector = step.requiredSelector ?? step.targetSelector;

    if (selector && !document.querySelector(selector)) continue;

    if (step.isOutro) {
      outro.push(step);
      continue;
    }

    if (isManual || version > lastVersion) {
      normal.push(step);
    }
  }

  if (normal.length === 0) return [];

  return [...normal, ...outro];
}

export function calculateMaxVersion(steps: TourStep[]): number {
  let max = 1;
  for (const step of steps) {
    const v = step.since ?? 1;
    if (v > max) max = v;
  }
  return max;
}
