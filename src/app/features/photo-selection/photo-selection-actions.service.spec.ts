import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PhotoSelectionActionsService } from './photo-selection-actions.service';
import { TabloWorkflowService } from './services/tablo-workflow.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';
import { AuthService } from '../../core/services/auth.service';

describe('PhotoSelectionActionsService', () => {
  let service: PhotoSelectionActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PhotoSelectionActionsService,
        { provide: TabloWorkflowService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
        { provide: TabloStorageService, useValue: { get: vi.fn(), set: vi.fn() } },
        { provide: AuthService, useValue: { getProject: vi.fn() } },
      ],
    });
    service = TestBed.inject(PhotoSelectionActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
