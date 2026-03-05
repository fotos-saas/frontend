import { describe, it, expect } from 'vitest';
import { MissingFilterService } from './missing-filter.service';

describe('MissingFilterService', () => {
  const service = new MissingFilterService();

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStudentCount should return 0 for null', () => {
    expect(service.getStudentCount(null)).toBe(0);
  });

  it('getTeacherCount should return 0 for null', () => {
    expect(service.getTeacherCount(null)).toBe(0);
  });
});
