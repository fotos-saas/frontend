import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { ProjectListActionsService } from './project-list-actions.service';
import { PartnerService } from '../../services/partner.service';
import { PartnerPreliminaryService } from '../../services/partner-preliminary.service';
import { PartnerOrderSyncService } from '../../services/partner-order-sync.service';
import { PsdStatusService } from '../../services/psd-status.service';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { ElectronService } from '../../../../core/services/electron.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('ProjectListActionsService', () => {
  let service: ProjectListActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectListActionsService,
        { provide: PartnerService, useValue: {} },
        { provide: PartnerPreliminaryService, useValue: {} },
        { provide: PartnerOrderSyncService, useValue: {} },
        { provide: PsdStatusService, useValue: { checkProjects: vi.fn() } },
        { provide: BatchWorkspaceService, useValue: { addItems: vi.fn() } },
        { provide: ElectronService, useValue: { isElectron: false } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { error: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(ProjectListActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
