import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BatchQueuePersistService } from './batch-queue-persist.service';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { ElectronCacheService } from '@core/services/electron-cache.service';
import { ElectronNotificationService } from '@core/services/electron-notification.service';

describe('BatchQueuePersistService', () => {
  let service: BatchQueuePersistService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BatchQueuePersistService,
        { provide: LoggerService, useValue: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn() } },
        { provide: ElectronCacheService, useValue: { cacheSet: vi.fn(), cacheGet: vi.fn(() => Promise.resolve(null)) } },
        { provide: ElectronNotificationService, useValue: { showNotification: vi.fn(), setBadgeCount: vi.fn() } },
      ],
    });
    service = TestBed.inject(BatchQueuePersistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
