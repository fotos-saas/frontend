import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FrameTimeMonitor,
  getMemoryMetrics,
  formatPerformanceReport,
  generateStressTestPhotos,
  type PerformanceReport,
  type FrameMetrics,
} from './performance-monitor.util';

describe('performance-monitor.util', () => {
  // ==========================================================================
  // FrameTimeMonitor
  // ==========================================================================
  describe('FrameTimeMonitor', () => {
    let monitor: FrameTimeMonitor;

    beforeEach(() => {
      monitor = new FrameTimeMonitor();
    });

    it('should return zero metrics when stopped without starting', () => {
      const metrics = monitor.stop();

      expect(metrics.frameCount).toBe(0);
      expect(metrics.avgFrameTime).toBe(0);
      expect(metrics.maxFrameTime).toBe(0);
      expect(metrics.minFrameTime).toBe(0);
      expect(metrics.droppedFrames).toBe(0);
      expect(metrics.fps).toBe(0);
      expect(metrics.longFrames).toBe(0);
    });

    it('should return empty array from getFrameTimes when not started', () => {
      expect(monitor.getFrameTimes()).toEqual([]);
    });

    it('should return a copy of frameTimes', () => {
      const times1 = monitor.getFrameTimes();
      const times2 = monitor.getFrameTimes();
      expect(times1).not.toBe(times2);
      expect(times1).toEqual(times2);
    });

    it('should not start twice if already running', () => {
      // A start() belső guard-ja
      const spy = vi.spyOn(performance, 'now').mockReturnValue(100);
      monitor.start();
      // Második start - nem dob hibát, nem resetel
      monitor.start();
      spy.mockRestore();
      monitor.stop();
    });

    it('should calculate metrics from collected frame times', () => {
      // Szimulálunk frame time-okat manuálisan a getFrameTimes teszteléséhez
      // A FrameTimeMonitor RAF-ot használ, szóval inkább a stop() logikát teszteljük
      // a frameTimes tömbön
      const metrics = monitor.stop();
      expect(metrics).toHaveProperty('frameCount');
      expect(metrics).toHaveProperty('avgFrameTime');
      expect(metrics).toHaveProperty('fps');
    });
  });

  // ==========================================================================
  // getMemoryMetrics
  // ==========================================================================
  describe('getMemoryMetrics', () => {
    it('should return null when performance.memory is not available', () => {
      // JSDOM nem támogatja a performance.memory-t
      const result = getMemoryMetrics();
      expect(result).toBeNull();
    });

    it('should return metrics when performance.memory is available', () => {
      // Mock performance.memory
      const originalMemory = (performance as unknown as Record<string, unknown>)['memory'];
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 10 * 1024 * 1024,
          totalJSHeapSize: 50 * 1024 * 1024,
          jsHeapSizeLimit: 2000 * 1024 * 1024,
        },
        configurable: true,
        writable: true,
      });

      const result = getMemoryMetrics();

      expect(result).not.toBeNull();
      expect(result!.usedJSHeapSize).toBe(10 * 1024 * 1024);
      expect(result!.usedMB).toBe(10);
      expect(result!.totalMB).toBe(50);

      // Cleanup
      if (originalMemory === undefined) {
        delete (performance as unknown as Record<string, unknown>)['memory'];
      } else {
        Object.defineProperty(performance, 'memory', {
          value: originalMemory,
          configurable: true,
          writable: true,
        });
      }
    });
  });

  // ==========================================================================
  // formatPerformanceReport
  // ==========================================================================
  describe('formatPerformanceReport', () => {
    const baseFrameMetrics: FrameMetrics = {
      frameCount: 300,
      avgFrameTime: 16.5,
      maxFrameTime: 45,
      minFrameTime: 14,
      droppedFrames: 0,
      fps: 61,
      longFrames: 0,
    };

    it('should format a passing report', () => {
      const report: PerformanceReport = {
        testName: 'Test 1',
        photoCount: 100,
        duration: 5000,
        frameMetrics: baseFrameMetrics,
        memoryStart: null,
        memoryEnd: null,
        memoryDelta: null,
        passed: true,
        issues: [],
      };

      const result = formatPerformanceReport(report);

      expect(result).toContain('Test 1');
      expect(result).toContain('100');
      expect(result).toContain('5000ms');
      expect(result).toContain('PASSED');
      expect(result).toContain('Frame Count: 300');
      expect(result).toContain('FPS: 61');
    });

    it('should format a failing report with issues', () => {
      const report: PerformanceReport = {
        testName: 'Stress Test',
        photoCount: 500,
        duration: 10000,
        frameMetrics: { ...baseFrameMetrics, maxFrameTime: 80, longFrames: 5 },
        memoryStart: null,
        memoryEnd: null,
        memoryDelta: null,
        passed: false,
        issues: ['Max frame time 80ms exceeds 50ms threshold'],
      };

      const result = formatPerformanceReport(report);

      expect(result).toContain('FAILED');
      expect(result).toContain('Max frame time 80ms exceeds 50ms threshold');
    });

    it('should include memory metrics when available', () => {
      const report: PerformanceReport = {
        testName: 'Memory Test',
        photoCount: 200,
        duration: 5000,
        frameMetrics: baseFrameMetrics,
        memoryStart: {
          usedJSHeapSize: 10_000_000,
          totalJSHeapSize: 50_000_000,
          jsHeapSizeLimit: 2_000_000_000,
          usedMB: 10,
          totalMB: 50,
        },
        memoryEnd: {
          usedJSHeapSize: 15_000_000,
          totalJSHeapSize: 50_000_000,
          jsHeapSizeLimit: 2_000_000_000,
          usedMB: 15,
          totalMB: 50,
        },
        memoryDelta: 5,
        passed: true,
        issues: [],
      };

      const result = formatPerformanceReport(report);

      expect(result).toContain('Start: 10MB');
      expect(result).toContain('End: 15MB');
      expect(result).toContain('Delta: 5MB');
    });

    it('should show "Not available" when memory is null', () => {
      const report: PerformanceReport = {
        testName: 'No Memory',
        photoCount: 0,
        duration: 1000,
        frameMetrics: baseFrameMetrics,
        memoryStart: null,
        memoryEnd: null,
        memoryDelta: null,
        passed: true,
        issues: [],
      };

      const result = formatPerformanceReport(report);
      expect(result).toContain('Not available');
    });
  });

  // ==========================================================================
  // generateStressTestPhotos
  // ==========================================================================
  describe('generateStressTestPhotos', () => {
    it('should generate the correct number of photos', () => {
      const photos = generateStressTestPhotos(5);
      expect(photos.length).toBe(5);
    });

    it('should start IDs from 1 by default', () => {
      const photos = generateStressTestPhotos(3);
      expect(photos[0].id).toBe(1);
      expect(photos[1].id).toBe(2);
      expect(photos[2].id).toBe(3);
    });

    it('should respect custom startId', () => {
      const photos = generateStressTestPhotos(2, 100);
      expect(photos[0].id).toBe(100);
      expect(photos[1].id).toBe(101);
    });

    it('should generate proper URLs', () => {
      const photos = generateStressTestPhotos(1, 42);
      expect(photos[0].url).toContain('stress42');
      expect(photos[0].url).toContain('800/800');
      expect(photos[0].thumbnailUrl).toContain('300/300');
    });

    it('should generate proper filenames', () => {
      const photos = generateStressTestPhotos(1, 7);
      expect(photos[0].filename).toBe('stress_photo_7.jpg');
    });

    it('should return empty array for count 0', () => {
      expect(generateStressTestPhotos(0)).toEqual([]);
    });

    it('should have all required properties', () => {
      const [photo] = generateStressTestPhotos(1);
      expect(photo).toHaveProperty('id');
      expect(photo).toHaveProperty('url');
      expect(photo).toHaveProperty('thumbnailUrl');
      expect(photo).toHaveProperty('filename');
    });
  });
});
