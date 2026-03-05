import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BatchCropActionsService } from './batch-crop-actions.service';
import { PartnerService } from '../../../services/partner.service';
import { ElectronCropService } from '../../../../../core/services/electron-crop.service';
import { LoggerService } from '../../../../../core/services/logger.service';

describe('BatchCropActionsService', () => {
  let service: BatchCropActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BatchCropActionsService,
        { provide: PartnerService, useValue: {} },
        { provide: ElectronCropService, useValue: {} },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(BatchCropActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should have default signal values', () => {
    expect(service.phase()).toBe('idle');
    expect(service.progress()).toBe(0);
  });
});
