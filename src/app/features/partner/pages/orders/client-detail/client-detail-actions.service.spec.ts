import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ClientDetailActionsService } from './client-detail-actions.service';
import { PartnerOrdersService } from '../../../services/partner-orders.service';
import { ToastService } from '../../../../../core/services/toast.service';

describe('ClientDetailActionsService', () => {
  let service: ClientDetailActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientDetailActionsService,
        { provide: PartnerOrdersService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(ClientDetailActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
