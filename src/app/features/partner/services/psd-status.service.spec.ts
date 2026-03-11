import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElectronService } from '@core/services/electron.service';
import { LoggerService } from '@core/services/logger.service';
import { PsdStatusService } from './psd-status.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { PartnerProjectService } from './partner-project.service';

describe('PsdStatusService', () => {
  let service: PsdStatusService;

  const mockElectron = { isElectron: false };
  const mockPhotoshop = {
    workDir: vi.fn(() => null),
    detectPhotoshop: vi.fn(),
    openPsdFile: vi.fn(),
    revealInFinder: vi.fn(),
    computeProjectFolderPath: vi.fn(() => null),
    findProjectPsd: vi.fn(),
  };
  const mockBranding = { brandName: vi.fn(() => null) };
  const mockProjectService = { checkPhotoChanges: vi.fn(), batchCheckPhotoChanges: vi.fn() };
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PsdStatusService,
        { provide: ElectronService, useValue: mockElectron },
        { provide: PhotoshopService, useValue: mockPhotoshop },
        { provide: BrandingService, useValue: mockBranding },
        { provide: PartnerProjectService, useValue: mockProjectService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PsdStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty statusMap by default', () => {
    expect(service.statusMap().size).toBe(0);
  });

  it('getStatus should return null for unknown project', () => {
    expect(service.getStatus(999)).toBeNull();
  });

  it('checkProjects should skip when not electron', async () => {
    await service.checkProjects([{ id: 1, name: 'Test' } as any]);
    expect(service.statusMap().size).toBe(0);
  });
});
