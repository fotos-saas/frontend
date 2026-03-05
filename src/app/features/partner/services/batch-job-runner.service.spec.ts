import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BatchJobRunnerService } from './batch-job-runner.service';
import { LoggerService } from '@core/services/logger.service';
import { PartnerProjectService } from './partner-project.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { ToastService } from '@core/services/toast.service';
import { ElectronService } from '@core/services/electron.service';

describe('BatchJobRunnerService', () => {
  let service: BatchJobRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BatchJobRunnerService,
        { provide: LoggerService, useValue: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
        { provide: PartnerProjectService, useValue: { getProjectDetails: vi.fn(), getTabloSizes: vi.fn() } },
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: BrandingService, useValue: { brandName: vi.fn(() => null) } },
        { provide: ToastService, useValue: { error: vi.fn() } },
        { provide: ElectronService, useValue: { isElectron: false } },
      ],
    });
    service = TestBed.inject(BatchJobRunnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
