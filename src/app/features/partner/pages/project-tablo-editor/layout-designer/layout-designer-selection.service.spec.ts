import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';

describe('LayoutDesignerSelectionService', () => {
  let service: LayoutDesignerSelectionService;
  beforeEach(() => { service = new LayoutDesignerSelectionService(); });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
