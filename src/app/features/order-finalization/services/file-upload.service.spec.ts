import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FileUploadService } from './file-upload.service';
import { OrderFinalizationService } from './order-finalization.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { FileUploadService as CoreFileUploadService } from '../../../core/services/file-upload.service';

describe('FileUploadService (order-finalization)', () => {
  let service: FileUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FileUploadService,
        { provide: OrderFinalizationService, useValue: { uploadFile: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { error: vi.fn() } },
        { provide: CoreFileUploadService, useValue: { getConfig: vi.fn(() => ({ errorMessages: {} })), validateFile: vi.fn(() => ({ valid: true })), validateMagicBytes: vi.fn(), backgroundConfig: {}, attachmentConfig: {} } },
      ],
    });
    service = TestBed.inject(FileUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.backgroundUploading()).toBe(false);
    expect(service.attachmentUploading()).toBe(false);
    expect(service.uploadProgress()).toBe(0);
  });
});
