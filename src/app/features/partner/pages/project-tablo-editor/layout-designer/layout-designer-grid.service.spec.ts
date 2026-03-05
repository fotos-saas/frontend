import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';
import { PhotoshopService } from '../../../services/photoshop.service';

describe('LayoutDesignerGridService', () => {
  let service: LayoutDesignerGridService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerGridService,
        LayoutDesignerStateService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
      ],
    });
    service = TestBed.inject(LayoutDesignerGridService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
