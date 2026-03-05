import { describe, it, expect, beforeEach } from 'vitest';
import { StepReviewService } from './step-review.service';

describe('StepReviewService', () => {
  let service: StepReviewService;
  beforeEach(() => { service = new StepReviewService(); });
  it('should be created', () => { expect(service).toBeTruthy(); });
});
