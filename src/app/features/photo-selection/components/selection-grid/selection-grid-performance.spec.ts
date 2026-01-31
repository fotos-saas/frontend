/**
 * US-009 - Performance Validation Tests
 * SelectionGrid komponens teljesítmény tesztjei
 *
 * Teszteli:
 * - 100 képpel: smooth működés
 * - 500 képpel: smooth működés
 * - 1000 képpel: elfogadható működés
 * - Selection state kezelés nagy listákkal
 * - Memory efficiency
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, viewChild } from '@angular/core';
import { SelectionGridComponent } from './selection-grid.component';
import { WorkflowPhoto } from '../../models/workflow.models';
import { generateStressTestPhotos } from '../../../../shared/utils/performance-monitor.util';

// Test wrapper component
@Component({
  standalone: true,
  imports: [SelectionGridComponent],
  template: `
    <app-selection-grid
      #grid
      [photos]="photos"
      [selectedIds]="selectedIds"
      [allowMultiple]="true"
      [maxSelection]="null"
      [useVirtualScroll]="useVirtualScroll"
    />
  `,
})
class TestHostComponent {
  photos: WorkflowPhoto[] = [];
  selectedIds: number[] = [];
  useVirtualScroll = true;
  grid = viewChild.required<SelectionGridComponent>('grid');
}

describe('SelectionGrid Performance Tests - US-009', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Photo Generation', () => {
    it('should generate 100 photos quickly', () => {
      const start = performance.now();
      const photos = generateStressTestPhotos(100);
      const duration = performance.now() - start;

      expect(photos.length).toBe(100);
      expect(duration).toBeLessThan(50); // < 50ms
    });

    it('should generate 500 photos quickly', () => {
      const start = performance.now();
      const photos = generateStressTestPhotos(500);
      const duration = performance.now() - start;

      expect(photos.length).toBe(500);
      expect(duration).toBeLessThan(100); // < 100ms
    });

    it('should generate 1000 photos quickly', () => {
      const start = performance.now();
      const photos = generateStressTestPhotos(1000);
      const duration = performance.now() - start;

      expect(photos.length).toBe(1000);
      expect(duration).toBeLessThan(200); // < 200ms
    });
  });

  describe('100 Photos - Virtual Scroll', () => {
    beforeEach(() => {
      component.photos = generateStressTestPhotos(100);
      component.useVirtualScroll = true;
      fixture.detectChanges();
    });

    it('should render initial view quickly', () => {
      const start = performance.now();
      fixture.detectChanges();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // < 100ms initial render
    });

    it('should compute photoRows efficiently', () => {
      const grid = component.grid();
      const start = performance.now();

      // Access computed 10 times
      for (let i = 0; i < 10; i++) {
        grid.photoRows();
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Computed should be cached
    });

    it('should handle selection state efficiently with Set', () => {
      const grid = component.grid();
      component.selectedIds = [1, 25, 50, 75, 100];
      fixture.detectChanges();

      const start = performance.now();

      // Check selection for all photos
      for (const photo of component.photos) {
        grid.isSelected(photo.id);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20); // O(1) lookup with Set
    });
  });

  describe('500 Photos - Virtual Scroll', () => {
    beforeEach(() => {
      component.photos = generateStressTestPhotos(500);
      component.useVirtualScroll = true;
      fixture.detectChanges();
    });

    it('should render initial view within acceptable time', () => {
      const start = performance.now();
      fixture.detectChanges();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // < 200ms initial render
    });

    it('should compute photoRows efficiently for 500 photos', () => {
      const grid = component.grid();
      const start = performance.now();

      const rows = grid.photoRows();

      const duration = performance.now() - start;
      expect(rows.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // Should be fast
    });

    it('should handle 100 selected photos efficiently', () => {
      const grid = component.grid();
      // Select first 100 photos
      component.selectedIds = Array.from({ length: 100 }, (_, i) => i + 1);
      fixture.detectChanges();

      const start = performance.now();

      // Check isMaxReached computed
      grid.isMaxReached();

      // Check selection for all photos
      for (const photo of component.photos) {
        grid.isSelected(photo.id);
        grid.isDisabled(photo.id);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Set-based O(1) lookup
    });
  });

  describe('1000 Photos - Virtual Scroll', () => {
    beforeEach(() => {
      component.photos = generateStressTestPhotos(1000);
      component.useVirtualScroll = true;
      fixture.detectChanges();
    });

    it('should render initial view within acceptable time', () => {
      const start = performance.now();
      fixture.detectChanges();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // < 500ms initial render (acceptable)
    });

    it('should compute photoRows for 1000 photos', () => {
      const grid = component.grid();
      const start = performance.now();

      const rows = grid.photoRows();

      const duration = performance.now() - start;
      expect(rows.length).toBeGreaterThan(100); // At least 100 rows (1000 / max 6 cols)
      expect(duration).toBeLessThan(100); // Should still be fast
    });

    it('should handle 500 selected photos efficiently', () => {
      const grid = component.grid();
      // Select first 500 photos
      component.selectedIds = Array.from({ length: 500 }, (_, i) => i + 1);
      fixture.detectChanges();

      const start = performance.now();

      // Check selection for all 1000 photos
      for (const photo of component.photos) {
        grid.isSelected(photo.id);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Set-based O(1) lookup
    });

    it('should handle rapid selection changes', () => {
      const start = performance.now();

      // Simulate 100 rapid selection changes
      for (let i = 0; i < 100; i++) {
        component.selectedIds = Array.from({ length: i + 1 }, (_, j) => j + 1);
        fixture.detectChanges();
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // < 5s for 100 updates
    });
  });

  describe('Pagination Mode', () => {
    it('should handle 100 photos in pagination mode', () => {
      component.photos = generateStressTestPhotos(100);
      component.useVirtualScroll = false;
      fixture.detectChanges();

      const start = performance.now();
      fixture.detectChanges();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle load more efficiently', () => {
      // Start with 100 photos
      component.photos = generateStressTestPhotos(100);
      component.useVirtualScroll = false;
      fixture.detectChanges();

      // Simulate loading 100 more
      const start = performance.now();
      component.photos = generateStressTestPhotos(200);
      fixture.detectChanges();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not create excessive DOM nodes with virtual scroll', () => {
      component.photos = generateStressTestPhotos(1000);
      component.useVirtualScroll = true;
      fixture.detectChanges();

      // With virtual scroll, only visible rows should be in DOM
      const gridElement = fixture.nativeElement as HTMLElement;
      const photoItems = gridElement.querySelectorAll('.selection-grid__item');

      // Should be much less than 1000 (only visible viewport + buffer)
      expect(photoItems.length).toBeLessThan(100);
    });

    it('should reuse DOM nodes when scrolling (trackBy)', () => {
      const grid = component.grid();
      component.photos = generateStressTestPhotos(100);
      fixture.detectChanges();

      // TrackBy should return consistent values
      const photo1 = component.photos[0];
      const photo2 = component.photos[1];

      expect(grid.trackPhoto(0, photo1)).toBe(photo1.id);
      expect(grid.trackPhoto(1, photo2)).toBe(photo2.id);

      // TrackRow should return consistent values
      const row = { photos: [photo1, photo2], startIndex: 0 };
      expect(grid.trackRow(0, row)).toBe(0);
    });

    it('should efficiently track loaded images', () => {
      component.photos = generateStressTestPhotos(100);
      fixture.detectChanges();

      const grid = component.grid();

      const start = performance.now();

      // Mark 100 images as loaded
      for (const photo of component.photos) {
        grid.onImageLoad(photo.id);
      }

      // Check all as loaded
      for (const photo of component.photos) {
        grid.isImageLoaded(photo.id);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Set operations should be fast
    });
  });

  describe('Selection Helper Functions', () => {
    it('should handle range selection with 1000 photos efficiently', () => {
      component.photos = generateStressTestPhotos(1000);
      component.selectedIds = [];
      fixture.detectChanges();

      const grid = component.grid();
      const mockEvent = { shiftKey: false } as MouseEvent;

      const start = performance.now();

      // Simulate clicking first photo
      grid.onPhotoClick(component.photos[0], mockEvent);

      // Simulate shift+click on photo 500
      const shiftEvent = { shiftKey: true } as MouseEvent;
      grid.onPhotoClick(component.photos[499], shiftEvent);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Range selection should be fast
    });
  });
});

describe('SelectionGrid Performance Benchmarks', () => {
  /**
   * Benchmark helper - measures execution time
   */
  function benchmark(name: string, fn: () => void, iterations = 10): void {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`[BENCHMARK] ${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
  }

  it('should log performance benchmarks', () => {
    console.log('\n=== US-009 Performance Benchmarks ===\n');

    benchmark('Generate 100 photos', () => generateStressTestPhotos(100));
    benchmark('Generate 500 photos', () => generateStressTestPhotos(500));
    benchmark('Generate 1000 photos', () => generateStressTestPhotos(1000));

    // Selection Set creation
    benchmark('Create Set from 100 IDs', () => {
      new Set(Array.from({ length: 100 }, (_, i) => i));
    });

    benchmark('Create Set from 500 IDs', () => {
      new Set(Array.from({ length: 500 }, (_, i) => i));
    });

    benchmark('Create Set from 1000 IDs', () => {
      new Set(Array.from({ length: 1000 }, (_, i) => i));
    });

    // Set lookup
    const set1000 = new Set(Array.from({ length: 1000 }, (_, i) => i));
    benchmark('1000 Set lookups', () => {
      for (let i = 0; i < 1000; i++) {
        set1000.has(i);
      }
    });

    console.log('\n=== End Benchmarks ===\n');
  });
});
