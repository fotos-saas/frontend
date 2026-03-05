import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { AlbumDetailActionsService } from './album-detail-actions.service';
import { PartnerOrdersService } from '../../../services/partner-orders.service';
import { PartnerWebshopService } from '../../../services/partner-webshop.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ClipboardService } from '../../../../../core/services/clipboard.service';
import { UploadProgressService } from '../../../../../core/services/upload-progress.service';

describe('AlbumDetailActionsService', () => {
  let service: AlbumDetailActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AlbumDetailActionsService,
        { provide: PartnerOrdersService, useValue: {} },
        { provide: PartnerWebshopService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ClipboardService, useValue: { copyLink: vi.fn() } },
        { provide: UploadProgressService, useValue: { trackUpload: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(AlbumDetailActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
