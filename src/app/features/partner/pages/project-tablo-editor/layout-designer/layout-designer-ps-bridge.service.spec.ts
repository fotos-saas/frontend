import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LayoutDesignerPsBridgeService } from './layout-designer-ps-bridge.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';
import { PhotoshopService } from '../../../services/photoshop.service';
import { PartnerProjectService } from '../../../services/partner-project.service';

describe('LayoutDesignerPsBridgeService', () => {
  let service: LayoutDesignerPsBridgeService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LayoutDesignerPsBridgeService,
        LayoutDesignerStateService,
        LayoutDesignerHistoryService,
        LayoutDesignerSelectionService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
        { provide: PartnerProjectService, useValue: {} },
      ],
    });
    service = TestBed.inject(LayoutDesignerPsBridgeService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
