import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorCommandsService } from './tablo-editor-commands.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('TabloEditorCommandsService', () => {
  let service: TabloEditorCommandsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorCommandsService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: BrandingService, useValue: { brandName: vi.fn(() => null) } },
        { provide: TabloEditorSnapshotService, useValue: {} },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(TabloEditorCommandsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
