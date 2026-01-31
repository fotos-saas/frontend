import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ScrollLockService } from './scroll-lock.service';

describe('ScrollLockService', () => {
  let service: ScrollLockService;
  let originalScrollY: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollLockService]
    });
    service = TestBed.inject(ScrollLockService);

    // Mock window.scrollY
    originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollY', {
      value: 100,
      writable: true,
      configurable: true
    });

    // Mock window.scrollTo
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // Clean up any existing styles
    document.documentElement.style.position = '';
    document.documentElement.style.top = '';
    document.documentElement.style.width = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      writable: true,
      configurable: true
    });
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Initial state
  // ============================================================================
  describe('initial state', () => {
    it('should not be locked initially', () => {
      expect(service.locked).toBe(false);
    });
  });

  // ============================================================================
  // lock
  // ============================================================================
  describe('lock', () => {
    it('should set locked to true', () => {
      service.lock();
      expect(service.locked).toBe(true);
    });

    it('should apply fixed positioning to html element', () => {
      service.lock();

      expect(document.documentElement.style.position).toBe('fixed');
      expect(document.documentElement.style.top).toBe('-100px');
      expect(document.documentElement.style.width).toBe('100%');
    });

    it('should set body overflow to hidden', () => {
      service.lock();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should not re-lock if already locked', () => {
      service.lock();
      const spy = vi.spyOn(document.documentElement.style, 'setProperty');

      service.lock();

      // Should not set any new properties
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // unlock
  // ============================================================================
  describe('unlock', () => {
    it('should set locked to false', () => {
      service.lock();
      service.unlock();

      expect(service.locked).toBe(false);
    });

    it('should remove styles from html element', () => {
      service.lock();
      service.unlock();

      expect(document.documentElement.style.position).toBe('');
      expect(document.documentElement.style.top).toBe('');
      expect(document.documentElement.style.width).toBe('');
    });

    it('should reset body overflow', () => {
      service.lock();
      service.unlock();

      expect(document.body.style.overflow).toBe('');
    });

    it('should restore scroll position', () => {
      service.lock();
      service.unlock();

      expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
    });

    it('should not unlock if not locked', () => {
      service.unlock();
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // locked getter
  // ============================================================================
  describe('locked getter', () => {
    it('should return true when locked', () => {
      service.lock();
      expect(service.locked).toBe(true);
    });

    it('should return false when unlocked', () => {
      service.lock();
      service.unlock();
      expect(service.locked).toBe(false);
    });
  });
});
