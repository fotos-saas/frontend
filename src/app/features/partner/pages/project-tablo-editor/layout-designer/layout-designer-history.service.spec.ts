import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';

describe('LayoutDesignerHistoryService', () => {
  let service: LayoutDesignerHistoryService;
  beforeEach(() => { service = new LayoutDesignerHistoryService(); });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
