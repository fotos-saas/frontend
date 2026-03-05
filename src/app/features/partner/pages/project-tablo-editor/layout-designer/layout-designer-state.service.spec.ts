import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';

describe('LayoutDesignerStateService', () => {
  let service: LayoutDesignerStateService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerStateService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
      ],
    });
    service = TestBed.inject(LayoutDesignerStateService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
