import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LayoutDesignerSwapService } from './layout-designer-swap.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';

describe('LayoutDesignerSwapService', () => {
  let service: LayoutDesignerSwapService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerSwapService,
        LayoutDesignerStateService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
      ],
    });
    service = TestBed.inject(LayoutDesignerSwapService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
