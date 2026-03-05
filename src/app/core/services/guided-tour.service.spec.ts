import { TestBed } from '@angular/core/testing';
import { GuidedTourService } from './guided-tour.service';
import type { Tour, TourStep } from '../../shared/components/guided-tour/guided-tour.types';

vi.mock('../../shared/components/guided-tour/guided-tour-position.util', () => ({
  getSpotlightRect: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
}));

vi.mock('../../shared/components/guided-tour/guided-tour-filter.util', () => ({
  filterTourSteps: vi.fn((steps: TourStep[], _opts: any) => steps),
  calculateMaxVersion: vi.fn(() => 1),
}));

describe('GuidedTourService', () => {
  let service: GuidedTourService;

  const createTour = (id = 'test-tour', steps: Partial<TourStep>[] = [{ title: 'Step 1', description: 'Content 1' }]): Tour => ({
    id,
    name: 'Test Tour',
    steps: steps as TourStep[],
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuidedTourService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('start', () => {
    it('tour-t aktiválja', () => {
      service.start(createTour());
      expect(service.isActive()).toBe(true);
      expect(service.currentTour()?.id).toBe('test-tour');
      expect(service.currentStepIndex()).toBe(0);
    });
  });

  describe('next', () => {
    it('következő lépésre lép', () => {
      vi.useFakeTimers();
      service.start(createTour('t', [
        { title: 'S1', description: 'C1' } as TourStep,
        { title: 'S2', description: 'C2' } as TourStep,
      ]));

      service.next();
      vi.advanceTimersByTime(300);
      expect(service.currentStepIndex()).toBe(1);
      vi.useRealTimers();
    });

    it('utolsó lépésnél befejezi', () => {
      service.start(createTour());
      service.next();
      // A complete reset-eli az állapotot
      expect(service.isActive()).toBe(false);
    });
  });

  describe('prev', () => {
    it('első lépésnél nem lép vissza', () => {
      service.start(createTour());
      service.prev();
      expect(service.currentStepIndex()).toBe(0);
    });
  });

  describe('skip', () => {
    it('deaktiválja a tour-t', () => {
      service.start(createTour());
      service.skip();
      expect(service.isActive()).toBe(false);
    });
  });

  describe('computed signals', () => {
    it('stepCounter helyes formátum', () => {
      service.start(createTour('t', [
        { title: 'S1', description: 'C1' } as TourStep,
        { title: 'S2', description: 'C2' } as TourStep,
      ]));
      expect(service.stepCounter()).toBe('1/2');
    });

    it('isFirstStep / isLastStep', () => {
      service.start(createTour());
      expect(service.isFirstStep()).toBe(true);
      expect(service.isLastStep()).toBe(true);
    });
  });

  describe('recalculateRect', () => {
    it('null rect ha nincs target', () => {
      service.start(createTour());
      service.recalculateRect();
      expect(service.targetRect()).toBeNull();
    });
  });
});
