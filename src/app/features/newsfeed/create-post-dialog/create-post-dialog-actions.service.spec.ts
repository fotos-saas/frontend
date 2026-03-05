import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CreatePostDialogActionsService } from './create-post-dialog-actions.service';
import { NewsfeedService } from '../../../core/services/newsfeed.service';

describe('CreatePostDialogActionsService', () => {
  let service: CreatePostDialogActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NewsfeedService, useValue: { createPost: vi.fn(), updatePost: vi.fn() } },
      ],
    });
    service = TestBed.inject(CreatePostDialogActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
