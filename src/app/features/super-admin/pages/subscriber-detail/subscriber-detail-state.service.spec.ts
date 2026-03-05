import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { SubscriberDetailStateService } from './subscriber-detail-state.service';
import { SuperAdminService } from '../../services/super-admin.service';

describe('SubscriberDetailStateService', () => {
  let service: SubscriberDetailStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubscriberDetailStateService,
        { provide: SuperAdminService, useValue: { getSubscriber: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(SubscriberDetailStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.subscriber()).toBeNull();
    expect(service.loading()).toBe(true);
    expect(service.error()).toBeNull();
    expect(service.auditLogs()).toEqual([]);
    expect(service.isSubmitting()).toBe(false);
  });
});
