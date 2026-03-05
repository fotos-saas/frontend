import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrderFinalizationComponent } from './order-finalization.component';
import { OrderFinalizationService } from './services/order-finalization.service';
import { OrderValidationService } from './services/order-validation.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { AuthService } from '../../core/services/auth.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';
import { ContactData, BasicInfoData, DesignData, RosterData } from './models/order-finalization.models';

/**
 * OrderFinalizationComponent unit tesztek
 *
 * Tesztelendő:
 * - Lépések közötti navigáció
 * - Form validáció
 * - Adat frissítés
 * - Computed properties
 */
describe('OrderFinalizationComponent', () => {
  let component: OrderFinalizationComponent;
  let fixture: ComponentFixture<OrderFinalizationComponent>;
  let mockOrderFinalizationService: Partial<OrderFinalizationService>;
  let mockValidationService: Partial<OrderValidationService>;
  let mockToastService: Partial<ToastService>;
  let mockLoggerService: Partial<LoggerService>;
  let mockAuthService: Partial<AuthService>;
  let mockStorageService: Partial<TabloStorageService>;
  let mockRouter: Partial<Router>;

  const mockProject = { id: 1, name: 'Tesztprojekt' };

  const validContactData: ContactData = {
    name: 'Teszt Kapcsolat',
    email: 'teszt@example.com',
    phone: '+36301234567',
  };

  const validBasicInfoData: BasicInfoData = {
    schoolName: 'Teszt Iskola',
    city: 'Budapest',
    className: '12.A',
    classYear: '2024',
    quote: 'Teszt idézet',
  };

  const validDesignData: DesignData = {
    fontFamily: 'Arial',
    fontColor: '#000000',
    description: 'Teszt leírás',
    backgroundImageId: null,
    attachmentIds: [],
  };

  const validRosterData: RosterData = {
    studentRoster: 'Diák1\nDiák2',
    teacherRoster: 'Tanár1',
    sortType: 'abc',
    acceptTerms: true,
  };

  beforeEach(() => {
    mockOrderFinalizationService = {
      getExistingData: vi.fn().mockReturnValue(of({
        contact: validContactData,
        basicInfo: validBasicInfoData,
        design: validDesignData,
        roster: { ...validRosterData, acceptTerms: false },
      })),
      mapResponseToFormData: vi.fn().mockReturnValue({
        contact: validContactData,
        basicInfo: validBasicInfoData,
        design: validDesignData,
        roster: { ...validRosterData, acceptTerms: false },
      }),
      autoSaveDraft: vi.fn().mockReturnValue(of({ success: true })),
      generatePreviewPdf: vi.fn().mockReturnValue(of({ success: true, pdfUrl: 'https://example.com/preview.pdf' })),
      finalizeOrder: vi.fn().mockReturnValue(of({ success: true, message: 'Siker!' })),
    };

    mockValidationService = {
      isContactDataValid: vi.fn().mockImplementation((data: ContactData) =>
        !!(data.name && data.email && data.phone)
      ),
      isBasicInfoValid: vi.fn().mockImplementation((data: BasicInfoData) =>
        !!(data.schoolName && data.city && data.className && data.classYear)
      ),
      isDesignDataValid: vi.fn().mockReturnValue(true),
      isRosterDataValid: vi.fn().mockImplementation((data: RosterData) =>
        !!(data.studentRoster && data.acceptTerms)
      ),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    mockLoggerService = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    mockAuthService = {
      getProject: vi.fn().mockReturnValue(mockProject),
    };

    mockStorageService = {
      getCurrentStep: vi.fn().mockReturnValue(0),
      setCurrentStep: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [OrderFinalizationComponent],
      providers: [
        { provide: OrderFinalizationService, useValue: mockOrderFinalizationService },
        { provide: OrderValidationService, useValue: mockValidationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TabloStorageService, useValue: mockStorageService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(OrderFinalizationComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ============ Navigation Tests ============

  describe('Navigáció', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set valid data for all steps
      component.contactData.set(validContactData);
      component.basicInfoData.set(validBasicInfoData);
      component.designData.set(validDesignData);
      component.rosterData.set(validRosterData);
    });

    it('előre navigál ha az aktuális lépés valid', () => {
      // Arrange
      component.currentStep.set(0);

      // Act
      component.nextStep();

      // Assert
      expect(component.currentStep()).toBe(1);
    });

    it('nem navigál előre ha az aktuális lépés invalid', () => {
      // Arrange
      component.currentStep.set(0);
      component.contactData.set({ name: '', email: '', phone: '' });

      // Act
      component.nextStep();

      // Assert
      expect(component.currentStep()).toBe(0);
    });

    it('hátra navigál', () => {
      // Arrange
      component.currentStep.set(2);

      // Act
      component.prevStep();

      // Assert
      expect(component.currentStep()).toBe(1);
    });

    it('nem navigál hátra a 0. lépésről', () => {
      // Arrange
      component.currentStep.set(0);

      // Act
      component.prevStep();

      // Assert
      expect(component.currentStep()).toBe(0);
    });

    it('goToStep működik valid lépésre', () => {
      // Arrange
      component.currentStep.set(0);

      // Act
      component.goToStep(2);

      // Assert
      expect(component.currentStep()).toBe(2);
    });

    it('goToStep nem navigál invalid lépésre', () => {
      // Arrange
      component.currentStep.set(0);
      component.contactData.set({ name: '', email: '', phone: '' });

      // Act
      component.goToStep(2);

      // Assert
      expect(component.currentStep()).toBe(0);
    });
  });

  // ============ Data Update Tests ============

  describe('Adat frissítés', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('frissíti a contact adatokat', () => {
      // Act
      component.updateContactData(validContactData);

      // Assert
      expect(component.contactData()).toEqual(validContactData);
    });

    it('frissíti a basic info adatokat', () => {
      // Act
      component.updateBasicInfoData(validBasicInfoData);

      // Assert
      expect(component.basicInfoData()).toEqual(validBasicInfoData);
    });

    it('frissíti a design adatokat', () => {
      // Act
      component.updateDesignData(validDesignData);

      // Assert
      expect(component.designData()).toEqual(validDesignData);
    });

    it('frissíti a roster adatokat', () => {
      // Act
      component.updateRosterData(validRosterData);

      // Assert
      expect(component.rosterData()).toEqual(validRosterData);
    });
  });

  // ============ Validation Tests ============

  describe('Validáció', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('step1Valid true ha a contact adat valid', () => {
      // Arrange
      component.contactData.set(validContactData);

      // Assert
      expect(component.step1Valid()).toBe(true);
    });

    it('step1Valid false ha a contact adat invalid', () => {
      // Arrange
      component.contactData.set({ name: '', email: '', phone: '' });

      // Assert
      expect(component.step1Valid()).toBe(false);
    });

    it('allStepsValid true ha minden lépés valid', () => {
      // Arrange
      component.contactData.set(validContactData);
      component.basicInfoData.set(validBasicInfoData);
      component.designData.set(validDesignData);
      component.rosterData.set(validRosterData);

      // Assert
      expect(component.allStepsValid()).toBe(true);
    });

    it('allStepsValid false ha bármelyik lépés invalid', () => {
      // Arrange
      component.contactData.set(validContactData);
      component.basicInfoData.set({ ...validBasicInfoData, schoolName: '' });
      component.designData.set(validDesignData);
      component.rosterData.set(validRosterData);

      // Assert
      expect(component.allStepsValid()).toBe(false);
    });
  });

  // ============ Computed Properties Tests ============

  describe('Computed properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('currentStepValid az aktuális lépés validitását adja vissza', () => {
      // Arrange
      component.currentStep.set(0);
      component.contactData.set(validContactData);

      // Assert
      expect(component.currentStepValid()).toBe(true);
    });

    it('stepsCompleted helyesen számítja a befejezett lépéseket', () => {
      // Arrange
      component.contactData.set(validContactData);
      component.basicInfoData.set(validBasicInfoData);
      component.designData.set(validDesignData);
      component.rosterData.set({ ...validRosterData, acceptTerms: false });

      // Assert
      const completed = component.stepsCompleted();
      expect(completed[0]).toBe(true);  // Step 1 completed
      expect(completed[1]).toBe(true);  // Step 2 completed (step1 && step2)
      expect(completed[2]).toBe(true);  // Step 3 completed
      expect(completed[3]).toBe(false); // Step 4 not completed (acceptTerms false)
    });

    it('stepsAccessible helyesen számítja az elérhető lépéseket', () => {
      // Arrange
      component.contactData.set(validContactData);
      component.basicInfoData.set({ ...validBasicInfoData, schoolName: '' });

      // Assert
      const accessible = component.stepsAccessible();
      expect(accessible[0]).toBe(true);  // Step 1 always accessible
      expect(accessible[1]).toBe(true);  // Step 2 accessible (step1 valid)
      expect(accessible[2]).toBe(false); // Step 3 not accessible (step2 invalid)
      expect(accessible[3]).toBe(false); // Step 4 not accessible
    });
  });
});
