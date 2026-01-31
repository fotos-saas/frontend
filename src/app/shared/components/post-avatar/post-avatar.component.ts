import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar méret típus
 */
export type AvatarSize = 'tiny' | 'small' | 'medium';

/**
 * PostAvatarComponent
 *
 * Újrafelhasználható avatar komponens a szerző nevének kezdőbetűjével.
 * Használható: fórum post-ok, reply-k, kommentek, stb.
 *
 * @example
 * <app-post-avatar authorName="Kovács János" size="medium" />
 * <app-post-avatar authorName="Kiss Béla" size="small" />
 */
@Component({
  selector: 'app-post-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="post-avatar"
      [class.post-avatar--tiny]="size() === 'tiny'"
      [class.post-avatar--small]="size() === 'small'"
      [attr.aria-label]="'Avatar: ' + authorName()"
      role="img"
    >
      {{ initial() }}
    </div>
  `,
  styles: [`
    .post-avatar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: #3b82f6;
      border-radius: 50%;

      &--small {
        width: 1.75rem;
        height: 1.75rem;
        font-size: 0.75rem;
      }

      &--tiny {
        width: 1.375rem;
        height: 1.375rem;
        font-size: 0.625rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-avatar {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostAvatarComponent {
  /** Szerző neve */
  readonly authorName = input.required<string>();

  /** Avatar méret */
  readonly size = input<AvatarSize>('medium');

  /** Kezdőbetű kiszámítása */
  readonly initial = computed(() => {
    const name = this.authorName();
    return name ? name.charAt(0).toUpperCase() : '?';
  });
}
