import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('TabloEditorSnapshotService', () => {
  let service: TabloEditorSnapshotService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorSnapshotService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(TabloEditorSnapshotService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
