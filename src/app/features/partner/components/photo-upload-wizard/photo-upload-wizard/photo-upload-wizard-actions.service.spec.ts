import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { PhotoUploadWizardActionsService } from './photo-upload-wizard-actions.service';
import { PartnerService } from '../../../services/partner.service';
import { UploadProgressService } from '../../../../../core/services/upload-progress.service';

describe('PhotoUploadWizardActionsService', () => {
  let service: PhotoUploadWizardActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PhotoUploadWizardActionsService,
        { provide: PartnerService, useValue: {} },
        { provide: UploadProgressService, useValue: { trackUpload: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(PhotoUploadWizardActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
