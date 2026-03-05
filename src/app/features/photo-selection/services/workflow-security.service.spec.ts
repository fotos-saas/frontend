import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/services/auth.service';
import { WorkflowSecurityService } from './workflow-security.service';

describe('WorkflowSecurityService', () => {
  let service: WorkflowSecurityService;
  const mockAuthService = { getProject: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkflowSecurityService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(WorkflowSecurityService);
    mockAuthService.getProject.mockReset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('validateGalleryAccess should throw when no project', () => {
    mockAuthService.getProject.mockReturnValue(null);
    expect(() => service.validateGalleryAccess(1)).toThrow();
  });

  it('validateGalleryAccess should throw when no gallery', () => {
    mockAuthService.getProject.mockReturnValue({ tabloGalleryId: null });
    expect(() => service.validateGalleryAccess(1)).toThrow();
  });

  it('validateGalleryAccess should throw on mismatch', () => {
    mockAuthService.getProject.mockReturnValue({ tabloGalleryId: 99 });
    expect(() => service.validateGalleryAccess(1)).toThrow();
  });

  it('validateGalleryAccess should pass when matching', () => {
    mockAuthService.getProject.mockReturnValue({ tabloGalleryId: 5 });
    expect(() => service.validateGalleryAccess(5)).not.toThrow();
  });

  it('sanitizePhotoIds should filter invalid IDs', () => {
    expect(service.sanitizePhotoIds([1, -1, 0, NaN, 2, 2])).toEqual([1, 2]);
  });

  it('sanitizePhotoIds should return empty for non-array', () => {
    expect(service.sanitizePhotoIds(null as any)).toEqual([]);
  });

  it('isValidPhotoId should validate', () => {
    expect(service.isValidPhotoId(1)).toBe(true);
    expect(service.isValidPhotoId(0)).toBe(false);
    expect(service.isValidPhotoId(-1)).toBe(false);
    expect(service.isValidPhotoId(NaN)).toBe(false);
  });
});
