import { describe, it, expect, beforeEach } from 'vitest';
import { LightboxThumbnailService } from './lightbox-thumbnail.service';

describe('LightboxThumbnailService', () => {
  let service: LightboxThumbnailService;

  beforeEach(() => {
    service = new LightboxThumbnailService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isThumbnailLoaded should return false initially', () => {
    expect(service.isThumbnailLoaded(1)).toBe(false);
  });

  it('getThumbnailUrl should return placeholder for unloaded', () => {
    const url = service.getThumbnailUrl(1, '/real.jpg');
    expect(url).toContain('data:image/gif');
  });

  it('destroy should not throw', () => {
    expect(() => service.destroy()).not.toThrow();
  });
});
