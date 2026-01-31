import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';

/**
 * Workflow Header Component
 *
 * A képválasztás workflow fejléce - bal oldalon ikon + cím + leírás.
 * A stepper a jobb oldalra kerül (ng-content).
 */
@Component({
  selector: 'app-workflow-header',
  standalone: true,
  imports: [],
  template: `
    <header class="workflow-header">
      <!-- Bal oldal: ikon + szöveg -->
      <div class="workflow-header__left">
        <div class="workflow-header__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
          </svg>
        </div>
        <div class="workflow-header__text">
          <h1 class="workflow-header__title">{{ title() }}</h1>
          @if (description()) {
            <p class="workflow-header__description">{{ description() }}</p>
          }
        </div>
      </div>

      <!-- Jobb oldal: stepper (ng-content) -->
      <div class="workflow-header__right">
        <ng-content />
      </div>
    </header>
  `,
  styles: [`
    .workflow-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 12px;
      // Safari: gap nem támogatott
      > * {
        margin-bottom: 8px;
      }
      > *:last-child {
        margin-bottom: 0;
      }

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        > * {
          margin-bottom: 0;
        }
      }
    }

    .workflow-header__left {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .workflow-header__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      margin-right: 0.875rem;
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border-radius: 0.625rem;
      flex-shrink: 0;

      svg {
        width: 1.375rem;
        height: 1.375rem;
        color: #3b82f6;
      }
    }

    .workflow-header__text {
      min-width: 0;
    }

    .workflow-header__title {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;

      @media (min-width: 640px) {
        font-size: 1.5rem;
      }
    }

    .workflow-header__description {
      margin: 0.125rem 0 0;
      font-size: 0.8125rem;
      color: #374151;
      line-height: 1.4;
    }

    .workflow-header__right {
      flex-shrink: 0;
    }

    // Dark mode support
    :host-context(.dark) {
      .workflow-header__icon {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
      }

      .workflow-header__title {
        color: #f1f5f9;
      }

      .workflow-header__description {
        color: #94a3b8;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowHeaderComponent {
  /** Cím */
  readonly title = input<string>('Képválasztás');

  /** Leírás */
  readonly description = input<string | null>(null);
}
