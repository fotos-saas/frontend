import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { SettingsStateService } from './settings-state.service';
import { SubscriptionService } from '../../services/subscription.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('SettingsStateService', () => {
  let service: SettingsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SettingsStateService,
        { provide: SubscriptionService, useValue: { getSubscription: vi.fn() } },
        { provide: StorageService, useValue: { getUsage: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(SettingsStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.subscriptionInfo()).toBeNull();
    expect(service.isLoading()).toBe(true);
    expect(service.isActionLoading()).toBe(false);
    expect(service.showDeleteDialog()).toBe(false);
    expect(service.storageUsage()).toBeNull();
  });
});
