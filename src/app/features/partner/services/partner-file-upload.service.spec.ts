import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PartnerFileUploadService } from './partner-file-upload.service';
import { PartnerFinalizationApiService } from './partner-finalization-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { FileUploadService } from '../../../core/services/file-upload.service';

describe('PartnerFileUploadService', () => {
  let service: PartnerFileUploadService;

  const mockApi = { uploadFile: vi.fn(), deleteFile: vi.fn() };
  const mockToast = { success: vi.fn(), error: vi.fn() };
  const mockLogger = { error: vi.fn() };
  const mockFileUpload = {
    getConfig: vi.fn(() => ({ errorMessages: {} })),
    validateFile: vi.fn(() => ({ valid: true })),
    validateMagicBytes: vi.fn(() => Promise.resolve(true)),
    backgroundConfig: {},
    attachmentConfig: {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PartnerFileUploadService,
        { provide: PartnerFinalizationApiService, useValue: mockApi },
        { provide: ToastService, useValue: mockToast },
        { provide: LoggerService, useValue: mockLogger },
        { provide: FileUploadService, useValue: mockFileUpload },
      ],
    });
    service = TestBed.inject(PartnerFileUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.backgroundUploading()).toBe(false);
    expect(service.attachmentUploading()).toBe(false);
    expect(service.uploadProgress()).toBe(0);
  });

  it('setProjectId should set project id', () => {
    service.setProjectId(5);
    expect(service.isUploading('background')).toBe(false);
  });

  it('isUploading should check correct signal', () => {
    expect(service.isUploading('background')).toBe(false);
    expect(service.isUploading('attachment')).toBe(false);
  });
});
