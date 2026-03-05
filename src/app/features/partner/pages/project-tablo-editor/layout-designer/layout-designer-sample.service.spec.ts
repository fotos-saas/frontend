import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LayoutDesignerSampleService } from './layout-designer-sample.service';
import { PhotoshopService } from '../../../services/photoshop.service';

describe('LayoutDesignerSampleService', () => {
  let service: LayoutDesignerSampleService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutDesignerSampleService,
        { provide: PhotoshopService, useValue: { workDir: vi.fn(() => null) } },
      ],
    });
    service = TestBed.inject(LayoutDesignerSampleService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should have default signal values', () => {
    expect(service.generatingSample()).toBe(false);
    expect(service.generatingFinal()).toBe(false);
  });
});
