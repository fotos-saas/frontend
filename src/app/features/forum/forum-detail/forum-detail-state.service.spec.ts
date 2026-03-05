import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { ForumDetailStateService } from './forum-detail-state.service';
import { ForumService } from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { PostEditService } from '../../../core/services/post-edit.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('ForumDetailStateService', () => {
  let service: ForumDetailStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ForumDetailStateService,
        { provide: ForumService, useValue: { getDiscussionDetail: vi.fn() } },
        { provide: AuthService, useValue: { isGuest: vi.fn(() => false), getProject: vi.fn() } },
        { provide: GuestService, useValue: { hasRegisteredSession: vi.fn(() => false) } },
        { provide: PostEditService, useValue: {} },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LoggerService, useValue: { error: vi.fn(), warn: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(ForumDetailStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
