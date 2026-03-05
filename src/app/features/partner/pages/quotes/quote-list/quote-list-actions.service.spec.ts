import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { QuoteListActionsService } from './quote-list-actions.service';
import { PartnerQuoteService } from '../../../services/partner-quote.service';
import { ToastService } from '../../../../../core/services/toast.service';

describe('QuoteListActionsService', () => {
  let service: QuoteListActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QuoteListActionsService,
        { provide: PartnerQuoteService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(QuoteListActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should have default signal values', () => {
    expect(service.quotes()).toEqual([]);
    expect(service.loading()).toBe(false);
  });
});
