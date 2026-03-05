import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OnboardingDialogComponent } from './onboarding-dialog.component';
import { GuestService } from '../../../core/services/guest.service';
import { OnboardingFormService } from './onboarding-form.service';

describe('OnboardingDialogComponent', () => {
  let component: OnboardingDialogComponent;
  let fixture: ComponentFixture<OnboardingDialogComponent>;

  beforeEach(async () => {
    const mockGuestService = {
      searchPersons: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      requestRestoreLink: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockOnboardingFormService = {
      currentStep: vi.fn().mockReturnValue(null),
      selectedPerson: vi.fn().mockReturnValue(null),
      notFoundSelected: vi.fn().mockReturnValue(null),
      searchResults: vi.fn().mockReturnValue(null),
      isSearching: Object.assign(vi.fn().mockReturnValue(false), { set: vi.fn() }),
      errors: vi.fn().mockReturnValue({}),
      clearErrors: vi.fn(),
      stepTitles: vi.fn().mockReturnValue([]),
      stepDescriptions: vi.fn().mockReturnValue([]),
      stepIndex: vi.fn().mockReturnValue(0),
      hasSelection: vi.fn().mockReturnValue(false),
      isStepValid: vi.fn().mockReturnValue(false),
      getNextButtonText: vi.fn().mockReturnValue(''),
      clearSelection: vi.fn().mockReturnValue(null),
      selectPerson: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      selectNotFound: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      goToNextStep: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      goToPrevStep: vi.fn().mockReturnValue(null),
      validateEmail: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [OnboardingDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        { provide: GuestService, useValue: mockGuestService },
        { provide: OnboardingFormService, useValue: mockOnboardingFormService }
      ],
    })
    .overrideComponent(OnboardingDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnboardingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
