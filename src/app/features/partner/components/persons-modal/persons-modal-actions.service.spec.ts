import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { PersonsModalActionsService } from './persons-modal-actions.service';
import { PartnerProjectService } from '../../services/partner-project.service';
import { PartnerTeacherService } from '../../services/partner-teacher.service';

describe('PersonsModalActionsService', () => {
  let service: PersonsModalActionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PersonsModalActionsService,
        { provide: PartnerProjectService, useValue: {} },
        { provide: PartnerTeacherService, useValue: {} },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(PersonsModalActionsService);
  });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
