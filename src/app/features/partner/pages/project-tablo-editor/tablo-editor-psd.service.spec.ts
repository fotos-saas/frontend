import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorPsdService } from './tablo-editor-psd.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('TabloEditorPsdService', () => {
  let service: TabloEditorPsdService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorPsdService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: BrandingService, useValue: { brandName: vi.fn(() => null) } },
        { provide: TabloEditorSnapshotService, useValue: {} },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(TabloEditorPsdService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
