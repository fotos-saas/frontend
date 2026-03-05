import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BatchWorkspaceService } from './batch-workspace.service';

describe('BatchWorkspaceService', () => {
  let service: BatchWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchWorkspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.items()).toEqual([]);
    expect(service.panelOpen()).toBe(false);
    expect(service.selectedIds()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.hasSelection()).toBe(false);
  });
});
