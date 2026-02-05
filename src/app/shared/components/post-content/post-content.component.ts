import {
  Component,
  ChangeDetectionStrategy,
  input
} from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

/**
 * Font méret típus
 */
export type ContentFontSize = 'small' | 'normal';

/**
 * PostContentComponent
 *
 * Újrafelhasználható komponens HTML tartalom biztonságos megjelenítéséhez.
 * A SafeHtml pipe-ot használja az XSS védelem biztosításához.
 *
 * @example
 * <app-post-content [content]="post.content" fontSize="normal" />
 * <app-post-content [content]="reply.content" fontSize="small" />
 */
@Component({
  selector: 'app-post-content',
  standalone: true,
  imports: [SafeHtmlPipe],
  template: `
    <div
      class="post-content"
      [class.post-content--small]="fontSize() === 'small'"
      [innerHTML]="content() | safeHtml"
    ></div>
  `,
  styles: [`
    .post-content {
      font-size: 0.9375rem;
      color: #374151;
      line-height: 1.6;
      word-break: break-word;

      &--small {
        font-size: 0.875rem;
      }

      // Rich text editor HTML-hez
      :host ::ng-deep {
        p {
          margin: 0.5em 0;
        }

        ul, ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }

        a {
          color: #3b82f6;
          text-decoration: underline;

          &:hover {
            color: #2563eb;
          }
        }

        code {
          padding: 0.125em 0.25em;
          font-size: 0.875em;
          background: #f3f4f6;
          border-radius: 0.25rem;
        }

        blockquote {
          margin: 0.5em 0;
          padding-left: 1em;
          border-left: 3px solid #e5e7eb;
          color: #6b7280;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-content {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostContentComponent {
  /** HTML tartalom */
  readonly content = input.required<string>();

  /** Font méret */
  readonly fontSize = input<ContentFontSize>('normal');
}
