import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { GalleryMonitoringActionsService } from './gallery-monitoring-actions.service';
import { PartnerGalleryService } from '../../../../services/partner-gallery.service';
import { PartnerService } from '../../../../services/partner.service';
import { ToastService } from '../../../../../../core/services/toast.service';

describe('GalleryMonitoringActionsService', () => {
  let service: GalleryMonitoringActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GalleryMonitoringActionsService,
        { provide: PartnerGalleryService, useValue: {} },
        { provide: PartnerService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(GalleryMonitoringActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
