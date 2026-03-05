import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { PhotoSelectionComponent } from './photo-selection.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';
import { TabloWorkflowService } from './services/tablo-workflow.service';
import { WorkflowStep, StepData } from './models/workflow.models';

/**
 * PhotoSelectionComponent unit tesztek
 *
 * Tesztelendő:
 * - Kijelölés változás kezelése
 * - Navigáció lépések között
 * - Dialógusok működése
 * - Pagination
 * - Lightbox
 */
describe('PhotoSelectionComponent', () => {
  let component: PhotoSelectionComponent;
  let fixture: ComponentFixture<PhotoSelectionComponent>;
  let mockAuthService: Partial<AuthService>;
  let mockToastService: Partial<ToastService>;
  let mockLoggerService: Partial<LoggerService>;
  let mockStorageService: Partial<TabloStorageService>;
  let mockWorkflowService: Partial<TabloWorkflowService>;

  const mockProject = {
    id: 1,
    name: 'Tesztprojekt',
    schoolName: null,
    className: null,
    classYear: null,
  };

  const mockStepData: StepData = {
    current_step: 'claiming' as WorkflowStep,
    visible_photos: [
      { id: 1, url: '/photo1.jpg', thumbnailUrl: '/thumb1.jpg', filename: 'photo1.jpg' },
      { id: 2, url: '/photo2.jpg', thumbnailUrl: '/thumb2.jpg', filename: 'photo2.jpg' },
    ],
    selected_photos: [2],
    step_metadata: {
      allow_multiple: true,
      max_selection: 5,
      description: 'Jelöld ki az összes képet, amelyen te szerepelsz.',
    },
    album_id: 1,
    progress: null,
    work_session: { id: 1, max_retouch_photos: null },
  };

  beforeEach(() => {
    mockAuthService = {
      project$: of(mockProject),
      getProject: vi.fn().mockReturnValue(mockProject),
      updatePhotoDate: vi.fn().mockReturnValue(of({ success: true })),
    };

    mockWorkflowService = {
      loadStepData: vi.fn().mockReturnValue(of(mockStepData)),
      finalizeTabloSelection: vi.fn().mockReturnValue(of({ success: true })),
      previousStep: vi.fn().mockReturnValue(of(mockStepData)),
      nextStep: vi.fn().mockReturnValue(of(mockStepData)),
      requestModification: vi.fn().mockReturnValue(of({ success: true })),
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

    mockStorageService = {
      isStepInfoShown: vi.fn().mockReturnValue(true),
      setStepInfoShown: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PhotoSelectionComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TabloWorkflowService, useValue: mockWorkflowService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TabloStorageService, useValue: mockStorageService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(PhotoSelectionComponent);
    component = fixture.componentInstance;
  });

  // ============ Kijelölés Tests ============

  describe('Kijelölés kezelése', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('frissíti a state-et kijelöléskor', () => {
      // Act
      component.onSelectionChange([1, 3]);

      // Assert
      expect(component.state.selectedPhotoIds()).toEqual([1, 3]);
    });
  });

  // ============ Navigation Tests ============

  describe('Navigáció', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.state.selectedPhotoIds.set([1]);
      component.state.allowMultiple.set(true);
    });

    it('nem navigál ha nincs kijelölés', () => {
      // Arrange
      component.state.selectedPhotoIds.set([]);

      // Act
      component.onNextStep();

      // Assert - should not navigate (canProceed is false)
      expect(component.state.currentStep()).toBe('claiming');
    });
  });

  // ============ Dialog Tests ============

  describe('Dialógusok', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('megnyitja a confirm dialógust tablo lépésnél', () => {
      // Arrange
      component.state.currentStep.set('tablo');
      component.state.selectedPhotoIds.set([1]);

      // Act
      component.onNextStep();

      // Assert
      expect(component.state.confirmDialog.isOpen()).toBe(true);
    });

    it('bezárja az info dialógust', () => {
      // Arrange
      component.state.infoDialog.open();

      // Act
      component.onInfoDialogClose();

      // Assert
      expect(component.state.infoDialog.isOpen()).toBe(false);
    });

    it('kezeli a deselect confirm dialógust', () => {
      // Arrange
      component.state.selectedPhotoIds.set([1, 2, 3]);

      // Act
      component.onDeselectConfirmResult({ action: 'confirm' });

      // Assert - should clear selection
      expect(component.state.selectedPhotoIds()).toEqual([]);
    });
  });

  // ============ Max Selection Tests ============

  describe('Maximum kijelölés', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('toast üzenetet jelenít meg max eléréskor', () => {
      // Act
      component.onMaxReachedClick(5);

      // Assert
      expect(mockToastService.info).toHaveBeenCalledWith(
        'Maximum elerve',
        expect.stringContaining('5')
      );
    });
  });

  // ============ Schedule Dialog Tests ============

  describe('Fotózás dátum dialógus', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('megnyitja a schedule dialógust', () => {
      // Act
      component.onSetPhotoDate();

      // Assert
      expect(component.showScheduleDialog()).toBe(true);
    });

    it('bezárja a schedule dialógust', () => {
      // Arrange
      component.showScheduleDialog.set(true);

      // Act
      component.onScheduleDialogResult({ action: 'close' });

      // Assert
      expect(component.showScheduleDialog()).toBe(false);
    });
  });

  // ============ Lightbox Tests ============

  describe('Lightbox', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set visible photos for lightbox
      component.state.pagination.setAllPhotos(mockStepData.visible_photos, 2);
    });

    it('megnyitja a lightbox-ot zoom click-re', () => {
      // Act
      component.onZoomClick({ photo: mockStepData.visible_photos[0], index: 0 });

      // Assert
      expect(component.state.lightbox.isOpen()).toBe(true);
      expect(component.state.lightbox.currentIndex()).toBe(0);
    });
  });
});
