import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRankCardComponent } from '../../../shared/components/user-rank-card/user-rank-card.component';
import { LeaderboardComponent } from '../../../shared/components/leaderboard/leaderboard.component';
import { BadgeDisplayComponent } from '../../../shared/components/badge-display/badge-display.component';

type SidebarSection = 'rank' | 'leaderboard' | 'badges';

/**
 * Forum Sidebar Component
 *
 * A fórum oldalsávja, amely tartalmazza:
 * - Felhasználó rang kártya
 * - Toplista
 * - Badge-ek megjelenítése
 *
 * Collapse-olható szekciókkal.
 */
@Component({
  selector: 'app-forum-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    UserRankCardComponent,
    LeaderboardComponent,
    BadgeDisplayComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="forum-sidebar">
      <!-- Rank Card - always visible -->
      <section class="forum-sidebar__section">
        <app-user-rank-card />
      </section>

      <!-- Leaderboard - collapsible -->
      <section class="forum-sidebar__section">
        <button
          type="button"
          class="forum-sidebar__toggle"
          [class.forum-sidebar__toggle--open]="isOpen('leaderboard')"
          (click)="toggle('leaderboard')"
          [attr.aria-expanded]="isOpen('leaderboard')"
        >
          <span class="forum-sidebar__toggle-title">
            <svg class="forum-sidebar__toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Toplista
          </span>
          <svg
            class="forum-sidebar__toggle-arrow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        @if (isOpen('leaderboard')) {
          <div class="forum-sidebar__content">
            <app-leaderboard />
          </div>
        }
      </section>

      <!-- Badges - collapsible -->
      <section class="forum-sidebar__section">
        <button
          type="button"
          class="forum-sidebar__toggle"
          [class.forum-sidebar__toggle--open]="isOpen('badges')"
          (click)="toggle('badges')"
          [attr.aria-expanded]="isOpen('badges')"
        >
          <span class="forum-sidebar__toggle-title">
            <svg class="forum-sidebar__toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Kitűzők
          </span>
          <svg
            class="forum-sidebar__toggle-arrow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        @if (isOpen('badges')) {
          <div class="forum-sidebar__content">
            <app-badge-display />
          </div>
        }
      </section>
    </aside>
  `,
  styles: [`
    .forum-sidebar {
      display: flex;
      flex-direction: column;
      // Safari-safe: margin instead of gap
      margin: -12px 0;

      > * {
        margin: 12px 0;
      }
    }

    .forum-sidebar__section {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      &:first-child {
        background: transparent;
        box-shadow: none;
      }
    }

    .forum-sidebar__toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 16px 20px;
      background: white;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: #f9fafb;
      }

      &--open {
        border-bottom: 1px solid #e5e7eb;
      }
    }

    .forum-sidebar__toggle-title {
      display: flex;
      align-items: center;
      // Safari-safe: margin instead of gap
      margin: 0 -4px;
      font-size: 16px;
      font-weight: 600;
      color: #111827;

      > * {
        margin: 0 4px;
      }
    }

    .forum-sidebar__toggle-icon {
      width: 20px;
      height: 20px;
      color: #f59e0b;
    }

    .forum-sidebar__toggle-arrow {
      width: 20px;
      height: 20px;
      color: #9ca3af;
      transition: transform 0.2s ease;

      .forum-sidebar__toggle--open & {
        transform: rotate(180deg);
      }
    }

    .forum-sidebar__content {
      animation: slideDown 0.2s ease;

      // Override nested component styles
      :host ::ng-deep .leaderboard,
      :host ::ng-deep .badges {
        box-shadow: none;
        border-radius: 0;
      }

      :host ::ng-deep .leaderboard__header,
      :host ::ng-deep .badges__header {
        display: none;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    // Responsive
    @media (max-width: 1024px) {
      .forum-sidebar {
        display: grid;
        grid-template-columns: 1fr;
        // Safari-safe
        margin: -8px;

        > * {
          margin: 8px;
        }
      }
    }
  `]
})
export class ForumSidebarComponent {
  /** Show leaderboard initially */
  readonly showLeaderboard = input<boolean>(false);

  /** Show badges initially */
  readonly showBadges = input<boolean>(false);

  /** Open sections */
  private readonly openSections = signal<Set<SidebarSection>>(new Set(['rank']));

  /**
   * Check if section is open
   */
  isOpen(section: SidebarSection): boolean {
    return this.openSections().has(section);
  }

  /**
   * Toggle section
   */
  toggle(section: SidebarSection): void {
    const current = this.openSections();
    const newSet = new Set(current);

    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }

    this.openSections.set(newSet);
  }
}
