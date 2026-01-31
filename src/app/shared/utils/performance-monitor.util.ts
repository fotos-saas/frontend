/**
 * Performance Monitor Utility
 * US-009 - Teljesítmény validálás és stress teszt
 *
 * Eszközök a frame time és memory usage monitorozásához
 */

export interface FrameMetrics {
  frameCount: number;
  avgFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  droppedFrames: number;
  fps: number;
  longFrames: number; // 50ms+ frames
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  totalMB: number;
}

export interface PerformanceReport {
  testName: string;
  photoCount: number;
  duration: number;
  frameMetrics: FrameMetrics;
  memoryStart: MemoryMetrics | null;
  memoryEnd: MemoryMetrics | null;
  memoryDelta: number | null;
  passed: boolean;
  issues: string[];
}

/**
 * Frame time monitor - RAF alapú mérés
 */
export class FrameTimeMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.measure();
  }

  private measure(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.frameTimes.push(frameTime);
    this.lastFrameTime = now;

    this.rafId = requestAnimationFrame(() => this.measure());
  }

  stop(): FrameMetrics {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.frameTimes.length === 0) {
      return {
        frameCount: 0,
        avgFrameTime: 0,
        maxFrameTime: 0,
        minFrameTime: 0,
        droppedFrames: 0,
        fps: 0,
        longFrames: 0,
      };
    }

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const maxFrameTime = Math.max(...this.frameTimes);
    const minFrameTime = Math.min(...this.frameTimes);

    // 50ms+ = dropped frame (< 20fps)
    const droppedFrames = this.frameTimes.filter(t => t > 50).length;
    // Long frames (potentially janky)
    const longFrames = this.frameTimes.filter(t => t > 50).length;

    return {
      frameCount: this.frameTimes.length,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      maxFrameTime: Math.round(maxFrameTime * 100) / 100,
      minFrameTime: Math.round(minFrameTime * 100) / 100,
      droppedFrames,
      fps: Math.round(1000 / avgFrameTime),
      longFrames,
    };
  }

  getFrameTimes(): number[] {
    return [...this.frameTimes];
  }
}

/**
 * Memory monitor - performance.memory API (Chrome only)
 */
export function getMemoryMetrics(): MemoryMetrics | null {
  // performance.memory is Chrome-only
  const perf = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!perf.memory) {
    return null;
  }

  return {
    usedJSHeapSize: perf.memory.usedJSHeapSize,
    totalJSHeapSize: perf.memory.totalJSHeapSize,
    jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
    usedMB: Math.round((perf.memory.usedJSHeapSize / 1024 / 1024) * 100) / 100,
    totalMB: Math.round((perf.memory.totalJSHeapSize / 1024 / 1024) * 100) / 100,
  };
}

/**
 * Stress test runner
 */
export class StressTestRunner {
  private frameMonitor = new FrameTimeMonitor();

  async runTest(
    testName: string,
    photoCount: number,
    testFn: () => Promise<void>,
    durationMs = 5000
  ): Promise<PerformanceReport> {
    const issues: string[] = [];

    // Memory start
    const memoryStart = getMemoryMetrics();

    // Start frame monitoring
    this.frameMonitor.start();

    const startTime = performance.now();

    // Run the test
    await testFn();

    // Wait for the specified duration to capture frame metrics
    await this.wait(durationMs);

    const duration = performance.now() - startTime;

    // Stop monitoring
    const frameMetrics = this.frameMonitor.stop();

    // Memory end
    const memoryEnd = getMemoryMetrics();

    // Calculate memory delta
    let memoryDelta: number | null = null;
    if (memoryStart && memoryEnd) {
      memoryDelta = memoryEnd.usedMB - memoryStart.usedMB;
    }

    // Validate results
    if (frameMetrics.maxFrameTime > 50) {
      issues.push(`Max frame time ${frameMetrics.maxFrameTime}ms exceeds 50ms threshold`);
    }

    if (frameMetrics.longFrames > 0) {
      issues.push(`${frameMetrics.longFrames} frames exceeded 50ms (potential jank)`);
    }

    if (frameMetrics.fps < 30) {
      issues.push(`FPS ${frameMetrics.fps} is below 30fps threshold`);
    }

    if (memoryDelta !== null && memoryDelta > 50) {
      issues.push(`Memory increased by ${memoryDelta}MB during test (potential leak)`);
    }

    const passed = issues.length === 0;

    return {
      testName,
      photoCount,
      duration: Math.round(duration),
      frameMetrics,
      memoryStart,
      memoryEnd,
      memoryDelta: memoryDelta !== null ? Math.round(memoryDelta * 100) / 100 : null,
      passed,
      issues,
    };
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Console report formatter
 */
export function formatPerformanceReport(report: PerformanceReport): string {
  const statusIcon = report.passed ? '✅' : '❌';
  const lines = [
    `\n${statusIcon} Performance Report: ${report.testName}`,
    `${'='.repeat(50)}`,
    `Photo Count: ${report.photoCount}`,
    `Test Duration: ${report.duration}ms`,
    '',
    '📊 Frame Metrics:',
    `  - Frame Count: ${report.frameMetrics.frameCount}`,
    `  - Avg Frame Time: ${report.frameMetrics.avgFrameTime}ms`,
    `  - Max Frame Time: ${report.frameMetrics.maxFrameTime}ms`,
    `  - Min Frame Time: ${report.frameMetrics.minFrameTime}ms`,
    `  - FPS: ${report.frameMetrics.fps}`,
    `  - Long Frames (>50ms): ${report.frameMetrics.longFrames}`,
  ];

  if (report.memoryStart && report.memoryEnd) {
    lines.push(
      '',
      '💾 Memory Metrics:',
      `  - Start: ${report.memoryStart.usedMB}MB`,
      `  - End: ${report.memoryEnd.usedMB}MB`,
      `  - Delta: ${report.memoryDelta}MB`
    );
  } else {
    lines.push('', '💾 Memory Metrics: Not available (Chrome only)');
  }

  if (report.issues.length > 0) {
    lines.push('', '⚠️ Issues:', ...report.issues.map(i => `  - ${i}`));
  }

  lines.push('', `Result: ${report.passed ? 'PASSED' : 'FAILED'}`);

  return lines.join('\n');
}

/**
 * Mock photo generator (stress test-hez)
 */
export function generateStressTestPhotos(
  count: number,
  startId = 1
): { id: number; url: string; thumbnailUrl: string; filename: string }[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    // Használunk picsum.photos-t random képekhez
    url: `https://picsum.photos/seed/stress${startId + i}/800/800`,
    thumbnailUrl: `https://picsum.photos/seed/stress${startId + i}/300/300`,
    filename: `stress_photo_${startId + i}.jpg`,
  }));
}

/**
 * Scroll simulation helper
 */
export async function simulateScroll(
  element: HTMLElement,
  scrollAmount: number,
  steps: number,
  delayMs = 50
): Promise<void> {
  const stepSize = scrollAmount / steps;

  for (let i = 0; i < steps; i++) {
    element.scrollTop += stepSize;
    element.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

/**
 * Rapid scroll simulation (stress test)
 */
export async function simulateRapidScroll(
  element: HTMLElement,
  cycles: number,
  maxScroll: number
): Promise<void> {
  for (let i = 0; i < cycles; i++) {
    // Scroll down
    element.scrollTop = maxScroll;
    element.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Scroll up
    element.scrollTop = 0;
    element.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}
