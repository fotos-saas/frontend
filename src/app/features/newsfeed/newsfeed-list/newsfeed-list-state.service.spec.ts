import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { NewsfeedListStateService } from './newsfeed-list-state.service';
import { NewsfeedService } from '../../../core/services/newsfeed.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { ToastService } from '../../../core/services/toast.service';

describe('NewsfeedListStateService', () => {
  let service: NewsfeedListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NewsfeedListStateService,
        { provide: NewsfeedService, useValue: { getPosts: vi.fn() } },
        { provide: AuthService, useValue: { isGuest: vi.fn(() => false) } },
        { provide: GuestService, useValue: { hasRegisteredSession: vi.fn(() => false) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(NewsfeedListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.posts()).toEqual([]);
    expect(service.isLoading()).toBe(true);
    expect(service.errorMessage()).toBeNull();
  });
});
