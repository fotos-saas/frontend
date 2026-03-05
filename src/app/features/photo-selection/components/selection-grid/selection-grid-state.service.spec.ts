import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef, PLATFORM_ID } from '@angular/core';
import { SelectionGridStateService } from './selection-grid-state.service';

describe('SelectionGridStateService', () => {
  let service: SelectionGridStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SelectionGridStateService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(SelectionGridStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
