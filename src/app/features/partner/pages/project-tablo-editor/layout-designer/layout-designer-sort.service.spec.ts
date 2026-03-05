import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LayoutDesignerSortService } from './layout-designer-sort.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';
import { PartnerService } from '../../../services/partner.service';

describe('LayoutDesignerSortService', () => {
  let service: LayoutDesignerSortService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerSortService,
        LayoutDesignerStateService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
        { provide: PartnerService, useValue: {} },
      ],
    });
    service = TestBed.inject(LayoutDesignerSortService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
