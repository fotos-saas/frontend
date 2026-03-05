import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorDesignerActionsService } from './tablo-editor-designer-actions.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';

describe('TabloEditorDesignerActionsService', () => {
  let service: TabloEditorDesignerActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorDesignerActionsService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: TabloEditorSnapshotService, useValue: {} },
      ],
    });
    service = TestBed.inject(TabloEditorDesignerActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
