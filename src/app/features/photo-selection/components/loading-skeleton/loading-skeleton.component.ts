import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Loading Skeleton Component
 *
 * Shimmer effektes skeleton loading állapot a képek betöltésekor.
 */
@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [],
  template: `
    <div class="photo-selection__loading" aria-busy="true">
      <div class="photo-selection__loading-grid">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="photo-selection__skeleton-item skeleton-shimmer"></div>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonComponent {}
