import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ToastService, ToastConfig } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // Initial state
  // ============================================================================
  describe('initial state', () => {
    it('should have null toast initially', () => {
      expect(service.toast()).toBeNull();
    });
  });

  // ============================================================================
  // show
  // ============================================================================
  describe('show', () => {
    it('should set toast with provided config', () => {
      const config: ToastConfig = {
        type: 'success',
        title: 'Test Title',
        message: 'Test Message'
      };

      service.show(config);

      const toast = service.toast();
      expect(toast).not.toBeNull();
      expect(toast!.type).toBe('success');
      expect(toast!.title).toBe('Test Title');
      expect(toast!.message).toBe('Test Message');
      expect(toast!.visible).toBe(true);
    });

    it('should use default duration of 2500ms', () => {
      service.show({ type: 'info', title: 'Test', message: 'Test' });

      expect(service.toast()!.duration).toBe(2500);
    });

    it('should use custom duration if provided', () => {
      service.show({ type: 'info', title: 'Test', message: 'Test', duration: 5000 });

      expect(service.toast()!.duration).toBe(5000);
    });

    it('should auto-hide after duration', () => {
      service.show({ type: 'info', title: 'Test', message: 'Test', duration: 1000 });

      expect(service.toast()!.visible).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(service.toast()!.visible).toBe(false);

      vi.advanceTimersByTime(300);
      expect(service.toast()).toBeNull();
    });

    it('should clear previous toast when showing new one', () => {
      service.show({ type: 'info', title: 'First', message: 'First' });
      const firstId = service.toast()!.id;

      service.show({ type: 'error', title: 'Second', message: 'Second' });
      const secondId = service.toast()!.id;

      expect(secondId).not.toBe(firstId);
      expect(service.toast()!.title).toBe('Second');
    });

    it('should increment id for each toast', () => {
      service.show({ type: 'info', title: 'First', message: 'First' });
      const firstId = service.toast()!.id;

      vi.advanceTimersByTime(3000);

      service.show({ type: 'info', title: 'Second', message: 'Second' });
      const secondId = service.toast()!.id;

      expect(secondId).toBe(firstId + 1);
    });
  });

  // ============================================================================
  // hide
  // ============================================================================
  describe('hide', () => {
    it('should set visible to false', () => {
      service.show({ type: 'info', title: 'Test', message: 'Test' });

      service.hide();

      expect(service.toast()!.visible).toBe(false);
    });

    it('should set toast to null after animation delay', () => {
      service.show({ type: 'info', title: 'Test', message: 'Test' });

      service.hide();
      vi.advanceTimersByTime(300);

      expect(service.toast()).toBeNull();
    });

    it('should do nothing if no toast is shown', () => {
      service.hide();
      expect(service.toast()).toBeNull();
    });
  });

  // ============================================================================
  // success
  // ============================================================================
  describe('success', () => {
    it('should show success toast', () => {
      service.success('Success!', 'Operation completed');

      const toast = service.toast();
      expect(toast!.type).toBe('success');
      expect(toast!.title).toBe('Success!');
      expect(toast!.message).toBe('Operation completed');
    });

    it('should use custom duration if provided', () => {
      service.success('Success!', 'Message', 5000);

      expect(service.toast()!.duration).toBe(5000);
    });
  });

  // ============================================================================
  // error
  // ============================================================================
  describe('error', () => {
    it('should show error toast', () => {
      service.error('Error!', 'Something went wrong');

      const toast = service.toast();
      expect(toast!.type).toBe('error');
      expect(toast!.title).toBe('Error!');
      expect(toast!.message).toBe('Something went wrong');
    });

    it('should use default duration of 4000ms for errors', () => {
      service.error('Error!', 'Something went wrong');

      expect(service.toast()!.duration).toBe(4000);
    });

    it('should use custom duration if provided', () => {
      service.error('Error!', 'Message', 6000);

      expect(service.toast()!.duration).toBe(6000);
    });
  });

  // ============================================================================
  // info
  // ============================================================================
  describe('info', () => {
    it('should show info toast', () => {
      service.info('Info', 'FYI message');

      const toast = service.toast();
      expect(toast!.type).toBe('info');
      expect(toast!.title).toBe('Info');
      expect(toast!.message).toBe('FYI message');
    });
  });
});
