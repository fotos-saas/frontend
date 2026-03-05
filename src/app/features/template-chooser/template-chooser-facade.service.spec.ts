import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { TemplateChooserFacadeService } from './template-chooser-facade.service';
import { TemplateChooserService } from './services/template-chooser.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';

describe('TemplateChooserFacadeService', () => {
  let service: TemplateChooserFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TemplateChooserFacadeService,
        { provide: TemplateChooserService, useValue: { getCategories: vi.fn(), getTemplates: vi.fn(), getSelections: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(TemplateChooserFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.categories()).toEqual([]);
  });
});
