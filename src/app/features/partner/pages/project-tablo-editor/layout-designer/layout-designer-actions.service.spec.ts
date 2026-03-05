import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LayoutDesignerActionsService } from './layout-designer-actions.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';
import { PhotoshopService } from '../../../services/photoshop.service';

describe('LayoutDesignerActionsService', () => {
  let service: LayoutDesignerActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerActionsService,
        LayoutDesignerStateService,
        LayoutDesignerGridService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
      ],
    });
    service = TestBed.inject(LayoutDesignerActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
