import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { LayoutDesignerDragService } from './layout-designer-drag.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerSwapService } from './layout-designer-swap.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';
import { PhotoshopService } from '../../../services/photoshop.service';

describe('LayoutDesignerDragService', () => {
  let service: LayoutDesignerDragService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerDragService,
        LayoutDesignerStateService,
        LayoutDesignerGridService,
        LayoutDesignerSwapService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
      ],
    });
    service = TestBed.inject(LayoutDesignerDragService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
