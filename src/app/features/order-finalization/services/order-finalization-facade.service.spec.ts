import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { OrderFinalizationFacadeService } from './order-finalization-facade.service';
import { OrderFinalizationService } from './order-finalization.service';
import { OrderValidationService } from './order-validation.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { AuthService } from '../../../core/services/auth.service';
import { TabloStorageService } from '../../../core/services/tablo-storage.service';

describe('OrderFinalizationFacadeService', () => {
  let service: OrderFinalizationFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderFinalizationFacadeService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: OrderFinalizationService, useValue: {} },
        { provide: OrderValidationService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { error: vi.fn(), info: vi.fn() } },
        { provide: AuthService, useValue: { getProject: vi.fn() } },
        { provide: TabloStorageService, useValue: { get: vi.fn(), set: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(OrderFinalizationFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
