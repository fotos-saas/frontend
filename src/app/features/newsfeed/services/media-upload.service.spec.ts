import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MediaUploadService } from './media-upload.service';

describe('MediaUploadService', () => {
  let service: MediaUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('removeFile should remove by index', () => {
    const f1 = new File(['a'], 'a.jpg');
    const f2 = new File(['b'], 'b.jpg');
    const result = service.removeFile([f1, f2], 0);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(f2);
  });

  it('filterRemainingMedia should filter out deleted ids', () => {
    const media = [
      { id: 1, url: '/a.jpg', fileName: 'a.jpg', isImage: true },
      { id: 2, url: '/b.jpg', fileName: 'b.jpg', isImage: true },
    ];
    const result = service.filterRemainingMedia(media, [1]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  it('filterRemainingMedia should handle undefined', () => {
    expect(service.filterRemainingMedia(undefined, [])).toEqual([]);
  });

  it('markForDeletion should add id', () => {
    expect(service.markForDeletion([], 5)).toEqual([5]);
  });

  it('markForDeletion should not duplicate', () => {
    expect(service.markForDeletion([5], 5)).toEqual([5]);
  });

  it('undoDeletion should remove id', () => {
    expect(service.undoDeletion([3, 5], 5)).toEqual([3]);
  });

  it('maxFiles should return a number', () => {
    expect(service.maxFiles).toBeGreaterThan(0);
  });
});
