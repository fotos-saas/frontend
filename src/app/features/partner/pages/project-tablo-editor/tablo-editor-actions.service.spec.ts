import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloEditorActionsService } from './tablo-editor-actions.service';
import { TabloEditorPsdService } from './tablo-editor-psd.service';
import { TabloEditorDesignerActionsService } from './tablo-editor-designer-actions.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';

describe('TabloEditorActionsService', () => {
  let service: TabloEditorActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloEditorActionsService,
        { provide: TabloEditorPsdService, useValue: {} },
        { provide: TabloEditorDesignerActionsService, useValue: {} },
        { provide: TabloEditorSnapshotService, useValue: {} },
      ],
    });
    service = TestBed.inject(TabloEditorActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
