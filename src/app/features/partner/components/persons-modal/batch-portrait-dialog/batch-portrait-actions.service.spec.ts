import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BatchPortraitActionsService } from './batch-portrait-actions.service';
import { PartnerService } from '../../../services/partner.service';
import { ElectronPortraitService } from '../../../../../core/services/electron-portrait.service';
import { LoggerService } from '../../../../../core/services/logger.service';

describe('BatchPortraitActionsService', () => {
  let service: BatchPortraitActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BatchPortraitActionsService,
        { provide: PartnerService, useValue: {} },
        { provide: ElectronPortraitService, useValue: {} },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(BatchPortraitActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
