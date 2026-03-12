import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef, NgZone } from '@angular/core';
import { OverlayPollingService } from './overlay-polling.service';
import { ActiveDocInfo } from '../../core/services/electron.types';

describe('OverlayPollingService', () => {
  let service: OverlayPollingService;
  let destroyCallbacks: (() => void)[];
  let mockDestroyRef: DestroyRef;

  beforeEach(() => {
    vi.useFakeTimers();

    destroyCallbacks = [];
    mockDestroyRef = {
      onDestroy: vi.fn((cb: () => void) => { destroyCallbacks.push(cb); }),
    } as unknown as DestroyRef;

    // electronAPI mock a window-ra
    (window as any).electronAPI = { photoshop: { runJsx: vi.fn() } };

    TestBed.configureTestingModule({
      providers: [OverlayPollingService],
    });

    service = TestBed.inject(OverlayPollingService);
  });

  afterEach(() => {
    destroyCallbacks.forEach(cb => cb());
    delete (window as any).electronAPI;
    vi.useRealTimers();
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('Kezdeti állapot', () => {
    it('isTurbo false', () => {
      expect(service.isTurbo()).toBe(false);
    });

    it('isEnabled true', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('activeDoc alapértéke { name: null, path: null, dir: null }', () => {
      expect(service.activeDoc()).toEqual({ name: null, path: null, dir: null });
    });

    it('isVisible alapból true', () => {
      expect(service.getIsVisible()).toBe(true);
    });
  });

  // ============================================================================
  // startPolling
  // ============================================================================
  describe('startPolling', () => {
    it('azonnal meghívja a callback-et', () => {
      const callback = vi.fn().mockResolvedValue(undefined);

      service.startPolling(mockDestroyRef, callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('5000ms-enként hívja a callback-et normál módban', () => {
      const callback = vi.fn().mockResolvedValue(undefined);

      service.startPolling(mockDestroyRef, callback);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('nem indít pollingot ha nincs electronAPI', () => {
      delete (window as any).electronAPI;
      const callback = vi.fn().mockResolvedValue(undefined);

      service.startPolling(mockDestroyRef, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('destroy-kor leállítja a timer-eket', () => {
      const callback = vi.fn().mockResolvedValue(undefined);

      service.startPolling(mockDestroyRef, callback);
      expect(callback).toHaveBeenCalledTimes(1);

      // Destroy triggering
      destroyCallbacks.forEach(cb => cb());

      vi.advanceTimersByTime(10000);
      // A destroy után nem hívódik többet
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // toggleEnabled
  // ============================================================================
  describe('toggleEnabled', () => {
    it('ki-be kapcsolja az isEnabled flag-et', () => {
      expect(service.isEnabled()).toBe(true);
      service.toggleEnabled();
      expect(service.isEnabled()).toBe(false);
      service.toggleEnabled();
      expect(service.isEnabled()).toBe(true);
    });

    it('kikapcsoláskor szünetelteti a pollingot', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);
      callback.mockClear();

      service.toggleEnabled(); // disable
      vi.advanceTimersByTime(10000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('visszakapcsoláskor folytatja a pollingot', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);
      callback.mockClear();

      service.toggleEnabled(); // disable
      service.toggleEnabled(); // re-enable

      // Azonnal meghívja a resume-nál
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('kikapcsoláskor leállítja a turbo módot', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);

      service.toggleTurbo(); // turbo ON
      expect(service.isTurbo()).toBe(true);

      service.toggleEnabled(); // disable
      expect(service.isTurbo()).toBe(false);
    });
  });

  // ============================================================================
  // toggleTurbo
  // ============================================================================
  describe('toggleTurbo', () => {
    it('bekapcsolja a turbo módot', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);

      service.toggleTurbo();

      expect(service.isTurbo()).toBe(true);
    });

    it('kikapcsolja a turbo módot ha már aktív', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);

      service.toggleTurbo(); // ON
      service.toggleTurbo(); // OFF

      expect(service.isTurbo()).toBe(false);
    });

    it('turbo módban 1000ms-enként pollol', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);
      callback.mockClear();

      service.toggleTurbo();

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('turbo mód 2 perc után automatikusan leáll', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);

      service.toggleTurbo();
      expect(service.isTurbo()).toBe(true);

      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(service.isTurbo()).toBe(false);
    });

    it('nem kapcsol be ha a polling disabled', () => {
      service.toggleEnabled(); // disable
      service.toggleTurbo();

      expect(service.isTurbo()).toBe(false);
    });
  });

  // ============================================================================
  // mergeActiveDoc
  // ============================================================================
  describe('mergeActiveDoc', () => {
    it('frissíti az activeDoc-ot', () => {
      const doc: ActiveDocInfo = { name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp' };
      service.mergeActiveDoc(doc);

      expect(service.activeDoc().name).toBe('test.psd');
      expect(service.activeDoc().path).toBe('/tmp/test.psd');
    });

    it('megőrzi a selectedLayers-t ha az új doc-ban nincs', () => {
      service.activeDoc.set({ name: 'old.psd', path: '/old', dir: '/old', selectedLayers: 3 });

      service.mergeActiveDoc({ name: 'new.psd', path: '/new', dir: '/new' });

      expect(service.activeDoc().name).toBe('new.psd');
      expect(service.activeDoc().selectedLayers).toBe(3);
    });

    it('felülírja a selectedLayers-t ha az új doc-ban van', () => {
      service.activeDoc.set({ name: 'old.psd', path: '/old', dir: '/old', selectedLayers: 3 });

      service.mergeActiveDoc({ name: 'new.psd', path: '/new', dir: '/new', selectedLayers: 5 });

      expect(service.activeDoc().selectedLayers).toBe(5);
    });
  });

  // ============================================================================
  // listenVisibility
  // ============================================================================
  describe('listenVisibility', () => {
    it('registrálja a visibilitychange event listenert', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      service.listenVisibility(mockDestroyRef);

      expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('destroy-kor eltávolítja az event listener-t', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      service.listenVisibility(mockDestroyRef);

      destroyCallbacks.forEach(cb => cb());

      expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  // ============================================================================
  // executePoll — guardok
  // ============================================================================
  describe('executePoll guardok', () => {
    it('nem hívja a callback-et ha disabled', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      service.startPolling(mockDestroyRef, callback);
      callback.mockClear();

      service.toggleEnabled(); // disable
      vi.advanceTimersByTime(10000);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
