import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Média elem interface
 */
export interface PostMediaItem {
  url: string;
  fileName: string;
}

/**
 * PostMediaGalleryComponent
 *
 * Újrafelhasználható komponens kép csatolmányok grid megjelenítéséhez.
 * Kattintásra emittál egy eventet a lightbox megnyitásához.
 *
 * @example
 * <app-post-media-gallery
 *   [media]="post.media"
 *   (mediaClick)="openLightbox(post.media, $event.index)"
 * />
 */
@Component({
  selector: 'app-post-media-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (media().length > 0) {
      <div class="post-media">
        @for (item of media(); track item.url; let i = $index) {
          <button
            type="button"
            class="post-media__item"
            (click)="onMediaClick(i)"
            (keydown.enter)="onMediaClick(i)"
            (keydown.space)="onMediaClick(i)"
            [attr.aria-label]="'Kép megnyitása: ' + item.fileName"
          >
            <img [src]="item.url" [alt]="item.fileName" loading="lazy" />
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .post-media {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;

      &__item {
        display: block;
        width: 50px;
        height: 50px;
        padding: 0;
        border: none;
        border-radius: 0.375rem;
        overflow: hidden;
        background: #f3f4f6;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        &:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-media__item {
        transition: none;

        &:hover {
          transform: none;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostMediaGalleryComponent {
  /** Média elemek listája */
  readonly media = input.required<PostMediaItem[]>();

  /** Kattintás esemény (index-szel) */
  readonly mediaClick = output<{ index: number }>();

  /**
   * Média elem kattintás kezelése
   */
  onMediaClick(index: number): void {
    this.mediaClick.emit({ index });
  }
}
