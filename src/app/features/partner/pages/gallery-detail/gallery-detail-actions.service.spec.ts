import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { GalleryDetailActionsService } from './gallery-detail-actions.service';
import { PartnerService } from '../../services/partner.service';
import { PartnerGalleryService } from '../../services/partner-gallery.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UploadProgressService } from '../../../../core/services/upload-progress.service';

describe('GalleryDetailActionsService', () => {
  let service: GalleryDetailActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GalleryDetailActionsService,
        { provide: PartnerService, useValue: {} },
        { provide: PartnerGalleryService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: UploadProgressService, useValue: { trackUpload: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(GalleryDetailActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
