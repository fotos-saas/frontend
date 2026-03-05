import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorTemplateService } from './tablo-editor-template.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('TabloEditorTemplateService', () => {
  let service: TabloEditorTemplateService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorTemplateService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(TabloEditorTemplateService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
