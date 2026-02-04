import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PhotoSelectionComponent } from './photo-selection.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';
import { TabloWorkflowService } from './services/tablo-workflow.service';
import { SelectionQueueService } from './services/selection-queue.service';
import { WorkflowNavigationService } from './services/workflow-navigation.service';
import { WorkflowStep, StepData } from './models/workflow.models';

/**
 * PhotoSelectionComponent unit tesztek
 *
 * Tesztelendő:
 * - Workflow betöltés
 * - Kijelölés változás kezelése
 * - Navigáció lépések között
 * - Dialógusok működése
 * - Pagination
 */
describe('PhotoSelectionComponent', () => {
  let component: PhotoSelectionComponent;
  let fixture: ComponentFixture<PhotoSelectionComponent>;
  let mockAuthService: Partial<AuthService>;
  let mockWorkflowService: Partial<TabloWorkflowService>;
  let mockQueueService: Partial<SelectionQueueService>;
  let mockNavigationService: Partial<WorkflowNavigationService>;
  let mockToastService: Partial<ToastService>;
  let mockLoggerService: Partial<LoggerService>;
  let mockStorageService: Partial<TabloStorageService>;

  const mockProject = {
    id: 1,
    name: 'Tesztprojekt',
    hasGallery: true,
    tabloGalleryId: 100,
  };

  const mockStepData: StepData = {
    current_step: 'claiming' as WorkflowStep,
    visible_photos: [
      { id: 1, url: '/photo1.jpg', thumbUrl: '/thumb1.jpg', originalName: 'photo1.jpg', isSelected: false },
      { id: 2, url: '/photo2.jpg', thumbUrl: '/thumb2.jpg', originalName: 'photo2.jpg', isSelected: true },
    ],
    selected_photos: [2],
    step_metadata: {
      allow_multiple: true,
      max_selection: 5,
    },
    workflow_completed: false,
    is_finalized: false,
  };

  beforeEach(() => {
    // Mock services
    mockAuthService = {
      project$: of(mockProject),
      getProject: vi.fn().mockReturnValue(mockProject),
    };

    mockWorkflowService = {
      loadStepData: vi.fn().mockReturnValue(of(mockStepData)),
      finalizeTabloSelection: vi.fn().mockReturnValue(of({ success: true })),
    };

    mockQueueService = {
      enqueue: vi.fn(),
      reset: vi.fn(),
    };

    mockNavigationService = {
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      moveToStep: vi.fn(),
      returnToCompleted: vi.fn(),
      viewStepReadonly: vi.fn(),
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
        { provide: SelectionQueueService, useValue: mockQueueService },
        { provide: WorkflowNavigationService, useValue: mockNavigationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TabloStorageService, useValue: mockStorageService },
      ],
    });

    fixture = TestBed.createComponent(PhotoSelectionComponent);
    component = fixture.componentInstance;
  });

  // ============ Workflow Loading Tests ============

  describe('Workflow betöltés', () => {
    it('betölti a workflow adatokat inicializáláskor', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(mockWorkflowService.loadStepData).toHaveBeenCalledWith(100);
    });

    it('kezeli a betöltési hibát', () => {
      // Arrange
      const error = new Error('Network error');
      mockWorkflowService.loadStepData = vi.fn().mockReturnValue(throwError(() => error));

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  // ============ Selection Tests ============

  describe('Kijelölés kezelése', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('enqueue-olja a kijelölés változást', () => {
      // Act
      component.onSelectionChange([1, 2, 3]);

      // Assert
      expect(mockQueueService.enqueue).toHaveBeenCalledWith(100, [1, 2, 3], 'claiming');
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
      // Simulate valid selection for navigation
      component.state.selectedPhotoIds.set([1]);
      component.state.allowMultiple.set(true);
    });

    it('nem navigál ha nincs kijelölés', () => {
      // Arrange
      component.state.selectedPhotoIds.set([]);

      // Act
      component.onNextStep();

      // Assert
      expect(mockNavigationService.nextStep).not.toHaveBeenCalled();
    });

    it('meghívja a previousStep szolgáltatást', () => {
      // Arrange
      component.state.currentStep.set('retouch');

      // Act
      component.onPreviousStep();

      // Assert
      expect(mockNavigationService.previousStep).toHaveBeenCalled();
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

      // Assert - should trigger selection change with empty array
      expect(mockQueueService.enqueue).toHaveBeenCalledWith(100, [], 'claiming');
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
        'Maximum elérve',
        expect.stringContaining('5')
      );
    });
  });

  // ============ Pagination Tests ============

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set up pagination state
      component.state.pagination.setAllPhotos(mockStepData.visible_photos, 10);
    });

    it('nem tölt be többet ha már folyamatban van', () => {
      // Arrange
      component.state.startLoadingMore();

      // Act
      component.onLoadMore();

      // Assert - should not trigger additional loading
      expect(component.state.isLoadingMore()).toBe(true);
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
