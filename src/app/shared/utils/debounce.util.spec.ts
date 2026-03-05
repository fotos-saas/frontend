import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebounceController } from './debounce.util';

describe('debounce.util', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createDebounceController', () => {
    it('trigger után delay-jel hívja a callback-et', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 300);

      debounce.trigger();
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('többszöri trigger csak egyszer hívja a callback-et', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 300);

      debounce.trigger();
      debounce.trigger();
      debounce.trigger();

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('trigger újraindítja a timer-t', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 300);

      debounce.trigger();
      vi.advanceTimersByTime(200);
      debounce.trigger(); // újraindít
      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('cancel megakadályozza a callback hívást', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 300);

      debounce.trigger();
      debounce.cancel();

      vi.advanceTimersByTime(300);
      expect(callback).not.toHaveBeenCalled();
    });

    it('flush azonnal meghívja a pending callback-et', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 300);

      debounce.trigger();
      debounce.flush();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('flush nem hív semmit ha nincs pending', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback);

      debounce.flush();
      expect(callback).not.toHaveBeenCalled();
    });

    it('flush után a timer nem hívja újra', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 300);

      debounce.trigger();
      debounce.flush();
      vi.advanceTimersByTime(300);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('alapértelmezett delay 300ms', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback);

      debounce.trigger();
      vi.advanceTimersByTime(299);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('cancel után újra trigger-elhető', () => {
      const callback = vi.fn();
      const debounce = createDebounceController(callback, 100);

      debounce.trigger();
      debounce.cancel();
      debounce.trigger();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
