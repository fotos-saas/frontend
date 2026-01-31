import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';

/**
 * Média elem interface
 */
export interface MediaItem {
  url: string;
  isImage: boolean;
  fileName?: string;
}

/**
 * MediaGridComponent
 *
 * Újrahasználható média előnézet grid.
 * Képek és videók megjelenítése thumbnail nézetben.
 *
 * @example
 * <app-media-grid
 *   [media]="post.media"
 *   [maxVisible]="3"
 *   [thumbnailSize]="64"
 *   (mediaClick)="openLightbox($event)"
 * />
 */
@Component({
  selector: 'app-media-grid',
  standalone: true,
  template: `
    @if (hasMedia()) {
      <div class="media-grid" [style.--thumb-size]="thumbnailSize() + 'px'">
        @for (item of visibleMedia(); track item.url; let i = $index) {
          <div
            class="media-grid__item"
            [class.media-grid__item--clickable]="item.isImage"
            (click)="onItemClick(i, item, $event)"
            [attr.role]="item.isImage ? 'button' : null"
            [attr.tabindex]="item.isImage ? 0 : null"
            (keydown.enter)="item.isImage ? onItemClick(i, item, $event) : null"
          >
            @if (item.isImage) {
              <img
                [src]="item.url"
                [alt]="'Kép ' + (i + 1) + '/' + visibleMedia().length"
                loading="lazy"
                class="media-grid__image"
              />
            } @else {
              <div class="media-grid__video" aria-label="Videó">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            }
          </div>
        }

        @if (moreCount() > 0) {
          <div class="media-grid__more" aria-label="További médiák száma">
            +{{ moreCount() }}
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      margin-top: 1.5rem;
    }

    .media-grid {
      --thumb-size: 64px;
      display: flex;
      gap: 0.5rem;
      overflow: hidden;

      &__item {
        flex-shrink: 0;
        width: var(--thumb-size);
        height: var(--thumb-size);
        border-radius: 0.5rem;
        overflow: hidden;
        background: #f3f4f6;

        &--clickable {
          cursor: zoom-in;
          transition: transform 0.2s, box-shadow 0.2s;

          &:hover {
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1;
          }

          &:active {
            transform: scale(1.02);
          }

          &:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
            transform: scale(1.05);
          }
        }
      }

      &__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: filter 0.2s;

        .media-grid__item--clickable:hover & {
          filter: brightness(1.05);
        }
      }

      &__video {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: #1f2937;
        color: white;

        svg {
          width: 1.5rem;
          height: 1.5rem;
        }
      }

      &__more {
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--thumb-size);
        height: var(--thumb-size);
        background: #f3f4f6;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .media-grid__item,
      .media-grid__image {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGridComponent {
  /** Média elemek listája */
  readonly media = input<MediaItem[]>([]);

  /** Maximum látható elemek száma */
  readonly maxVisible = input<number>(3);

  /** Thumbnail méret pixelben */
  readonly thumbnailSize = input<number>(64);

  /** Média kattintás esemény (index) */
  readonly mediaClick = output<{ index: number; item: MediaItem }>();

  /** Van-e média */
  readonly hasMedia = computed(() => this.media().length > 0);

  /** Látható média elemek */
  readonly visibleMedia = computed(() =>
    this.media().slice(0, this.maxVisible())
  );

  /** További elemek száma */
  readonly moreCount = computed(() =>
    Math.max(0, this.media().length - this.maxVisible())
  );

  /** Elem kattintás kezelése */
  onItemClick(index: number, item: MediaItem, event: Event): void {
    if (item.isImage) {
      event.stopPropagation();
      this.mediaClick.emit({ index, item });
    }
  }
}
