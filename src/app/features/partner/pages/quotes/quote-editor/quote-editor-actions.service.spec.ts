import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { QuoteEditorActionsService } from './quote-editor-actions.service';
import { PartnerQuoteService } from '../../../services/partner-quote.service';
import { ToastService } from '../../../../../core/services/toast.service';

describe('QuoteEditorActionsService', () => {
  let service: QuoteEditorActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QuoteEditorActionsService,
        { provide: PartnerQuoteService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(QuoteEditorActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should have default signal values', () => {
    expect(service.quote()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.saving()).toBe(false);
    expect(service.isNew()).toBe(true);
  });
});
