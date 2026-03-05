import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GuidedTourComponent } from './guided-tour.component';
import { GuidedTourService } from '../../../core/services/guided-tour.service';

describe('GuidedTourComponent', () => {
  let component: GuidedTourComponent;
  let fixture: ComponentFixture<GuidedTourComponent>;

  beforeEach(async () => {
    const mockGuidedTourService = {
      totalSteps: vi.fn().mockReturnValue(null),
      currentStepIndex: vi.fn().mockReturnValue(null),
      currentStep: vi.fn().mockReturnValue(null),
      targetRect: vi.fn().mockReturnValue(null),
      recalculateRect: vi.fn().mockReturnValue(null),
      isActive: vi.fn().mockReturnValue(null),
      skip: vi.fn().mockReturnValue(null),
      next: vi.fn().mockReturnValue(null),
      prev: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [GuidedTourComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GuidedTourService, useValue: mockGuidedTourService }
      ],
    })
    .overrideComponent(GuidedTourComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuidedTourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
