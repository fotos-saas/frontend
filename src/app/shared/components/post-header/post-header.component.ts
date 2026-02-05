import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input
} from '@angular/core';
import { formatTimeAgo } from '../../utils/time-formatter.util';

/**
 * Szerző típus
 */
export type AuthorType = 'contact' | 'guest' | 'user';

/**
 * PostHeaderComponent
 *
 * Újrafelhasználható header komponens a post szerző nevével, badge-ével és időpontjával.
 * Használható: fórum post-ok, reply-k, kommentek, stb.
 *
 * @example
 * <app-post-header
 *   authorName="Kovács János"
 *   authorType="contact"
 *   createdAt="2024-01-15T10:30:00Z"
 *   [isEdited]="true"
 * />
 */
@Component({
  selector: 'app-post-header',
  standalone: true,
  imports: [],
  template: `
    <div class="post-header">
      <span
        class="post-header__author"
        [class.post-header__author--contact]="authorType() === 'contact'"
      >
        {{ authorName() }}
        @if (showBadge()) {
          <span class="post-header__badge">{{ badgeLabel() }}</span>
        }
      </span>
      <span class="post-header__time">{{ formattedTime() }}</span>
      @if (isEdited()) {
        <span class="post-header__edited">(szerkesztve)</span>
      }
    </div>
  `,
  styles: [`
    .post-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      &__author {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #111827;

        &--contact {
          color: #2563eb;
        }
      }

      &__badge {
        padding: 0.125rem 0.375rem;
        font-size: 0.625rem;
        font-weight: 600;
        color: #3b82f6;
        background: #dbeafe;
        border-radius: 9999px;
        text-transform: uppercase;
      }

      &__time {
        font-size: 0.75rem;
        color: #6b7280; // gray-500 for better contrast (WCAG AA)
      }

      &__edited {
        font-size: 0.75rem;
        color: #6b7280; // gray-500 for better contrast (WCAG AA)
        font-style: italic;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-header {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostHeaderComponent {
  /** Szerző neve */
  readonly authorName = input.required<string>();

  /** Szerző típusa */
  readonly authorType = input.required<AuthorType>();

  /** Létrehozás időpontja (ISO string) */
  readonly createdAt = input.required<string>();

  /** Szerkesztve lett-e */
  readonly isEdited = input<boolean>(false);

  /** Egyedi badge szöveg (ha nincs, contact-nál "Kapcsolattartó" jelenik meg) */
  readonly badgeText = input<string | undefined>(undefined);

  /** Badge megjelenítése */
  readonly showBadge = computed(() => {
    return this.authorType() === 'contact' || !!this.badgeText();
  });

  /** Badge szöveg */
  readonly badgeLabel = computed(() => {
    const customText = this.badgeText();
    if (customText) return customText;
    return this.authorType() === 'contact' ? 'Kapcsolattartó' : '';
  });

  /** Formázott idő (relatív) - utility használata */
  readonly formattedTime = computed(() => formatTimeAgo(this.createdAt()));
}
