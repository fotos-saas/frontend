import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorDesignerBridgeService } from './tablo-editor-designer-bridge.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';

describe('TabloEditorDesignerBridgeService', () => {
  let service: TabloEditorDesignerBridgeService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorDesignerBridgeService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: TabloEditorSnapshotService, useValue: {} },
      ],
    });
    service = TestBed.inject(TabloEditorDesignerBridgeService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
