import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { VotingListFacadeService } from './voting-list-facade.service';
import { VotingService } from '../../../core/services/voting.service';
import { VoteParticipantsService } from '../../../core/services/vote-participants.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('VotingListFacadeService', () => {
  let service: VotingListFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VotingListFacadeService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: VotingService, useValue: { getPolls: vi.fn() } },
        { provide: VoteParticipantsService, useValue: {} },
        { provide: AuthService, useValue: { isGuest: vi.fn(() => false), getProject: vi.fn() } },
        { provide: GuestService, useValue: { hasRegisteredSession: vi.fn(() => false) } },
        { provide: LoggerService, useValue: { error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(VotingListFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default state', () => {
    expect(service.lightboxMedia()).toEqual([]);
  });
});
