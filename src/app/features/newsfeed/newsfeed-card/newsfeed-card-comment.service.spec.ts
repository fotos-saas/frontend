import { describe, it, expect, beforeEach } from 'vitest';
import { NewsfeedCardCommentService } from './newsfeed-card-comment.service';

describe('NewsfeedCardCommentService', () => {
  let service: NewsfeedCardCommentService;

  beforeEach(() => {
    service = new NewsfeedCardCommentService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty expandedReplies by default', () => {
    expect(service.expandedReplies().size).toBe(0);
  });
});
