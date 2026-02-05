import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  input
} from '@angular/core';
import {
  GamificationService,
  LeaderboardEntry
} from '../../../core/services/gamification.service';
import { GuestService } from '../../../core/services/guest.service';

type LeaderboardType = 'points' | 'posts' | 'likes';

/**
 * Leaderboard Component
 *
 * Toplista megjelenítése pontok, hozzászólások vagy like-ok alapján.
 */
@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="leaderboard">
      <!-- Header -->
      <div class="leaderboard__header">
        <h3 class="leaderboard__title">
          <svg class="leaderboard__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Toplista
        </h3>

        <!-- Type selector -->
        <div class="leaderboard__tabs">
          @for (tab of tabs; track tab.value) {
            <button
              type="button"
              class="leaderboard__tab"
              [class.leaderboard__tab--active]="selectedType() === tab.value"
              (click)="selectType(tab.value)"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Content -->
      <div class="leaderboard__content">
        @if (loading()) {
          <div class="leaderboard__loading">
            <div class="leaderboard__spinner"></div>
          </div>
        } @else if (entries().length === 0) {
          <div class="leaderboard__empty">
            Még nincs adat a toplistán
          </div>
        } @else {
          <ul class="leaderboard__list">
            @for (entry of entries(); track entry.rank) {
              <li
                class="leaderboard__entry"
                [class.leaderboard__entry--top3]="entry.rank <= 3"
                [class.leaderboard__entry--current]="isCurrentUser(entry)"
              >
                <!-- Rank -->
                <div class="leaderboard__rank" [attr.data-rank]="entry.rank">
                  @if (entry.rank === 1) {
                    <span class="leaderboard__medal leaderboard__medal--gold">🥇</span>
                  } @else if (entry.rank === 2) {
                    <span class="leaderboard__medal leaderboard__medal--silver">🥈</span>
                  } @else if (entry.rank === 3) {
                    <span class="leaderboard__medal leaderboard__medal--bronze">🥉</span>
                  } @else {
                    <span class="leaderboard__rank-number">{{ entry.rank }}</span>
                  }
                </div>

                <!-- User info -->
                <div class="leaderboard__user">
                  <span class="leaderboard__name">{{ entry.guest_name }}</span>
                  <span class="leaderboard__rank-name">{{ entry.rank_name }}</span>
                </div>

                <!-- Value -->
                <div class="leaderboard__value">
                  @switch (selectedType()) {
                    @case ('points') {
                      <span class="leaderboard__points">{{ entry.points }}</span>
                      <span class="leaderboard__label">pont</span>
                    }
                    @case ('posts') {
                      <span class="leaderboard__points">{{ entry.stats?.posts ?? 0 }}</span>
                      <span class="leaderboard__label">poszt</span>
                    }
                    @case ('likes') {
                      <span class="leaderboard__points">{{ entry.stats?.likes ?? 0 }}</span>
                      <span class="leaderboard__label">like</span>
                    }
                  }
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Current user rank (if not in top 10) -->
      @if (currentUserRank() && !isInLeaderboard()) {
        <div class="leaderboard__current-user">
          <div class="leaderboard__current-label">Te helyezésed:</div>
          <div class="leaderboard__current-rank">
            <span class="leaderboard__current-position">{{ currentUserRank()!.rank }}.</span>
            <span class="leaderboard__current-points">{{ currentUserRank()!.points }} pont</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .leaderboard {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .leaderboard__header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .leaderboard__title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .leaderboard__icon {
      width: 24px;
      height: 24px;
      color: #f59e0b;
    }

    .leaderboard__tabs {
      display: flex;
      gap: 8px;
    }

    .leaderboard__tab {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #e5e7eb;
      }

      &--active {
        color: white;
        background: #6366f1;

        &:hover {
          background: #4f46e5;
        }
      }
    }

    .leaderboard__content {
      min-height: 200px;
    }

    .leaderboard__loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .leaderboard__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .leaderboard__empty {
      padding: 48px 24px;
      text-align: center;
      color: #9ca3af;
    }

    .leaderboard__list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .leaderboard__entry {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f9fafb;
      }

      &--top3 {
        background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);

        &:hover {
          background: linear-gradient(90deg, #fde68a 0%, #f9fafb 100%);
        }
      }

      &--current {
        background: #eef2ff;

        &:hover {
          background: #e0e7ff;
        }
      }
    }

    .leaderboard__rank {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      flex-shrink: 0;
    }

    .leaderboard__medal {
      font-size: 24px;
    }

    .leaderboard__rank-number {
      font-size: 16px;
      font-weight: 600;
      color: #6b7280;
    }

    .leaderboard__user {
      flex: 1;
      min-width: 0;
    }

    .leaderboard__name {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .leaderboard__rank-name {
      display: block;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 2px;
    }

    .leaderboard__value {
      text-align: right;
      flex-shrink: 0;
    }

    .leaderboard__points {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: #6366f1;
    }

    .leaderboard__label {
      display: block;
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .leaderboard__current-user {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #f3f4f6;
      border-top: 1px solid #e5e7eb;
    }

    .leaderboard__current-label {
      font-size: 13px;
      color: #6b7280;
    }

    .leaderboard__current-rank {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .leaderboard__current-position {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }

    .leaderboard__current-points {
      font-size: 14px;
      color: #6366f1;
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly guestService = inject(GuestService);

  /** Compact mode input */
  readonly compact = input<boolean>(false);

  /** Selected leaderboard type */
  readonly selectedType = signal<LeaderboardType>('points');

  /** Tabs config */
  readonly tabs: Array<{ value: LeaderboardType; label: string }> = [
    { value: 'points', label: 'Pontok' },
    { value: 'posts', label: 'Posztok' },
    { value: 'likes', label: 'Like-ok' }
  ];

  /** Derived signals */
  readonly entries = this.gamificationService.leaderboard;
  readonly loading = this.gamificationService.loading;
  readonly currentUserRank = this.gamificationService.userRank;

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  selectType(type: LeaderboardType): void {
    this.selectedType.set(type);
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.gamificationService.fetchLeaderboard(projectId, this.selectedType()).subscribe();
    }
  }

  isCurrentUser(entry: LeaderboardEntry): boolean {
    const currentName = this.guestService.guestName();
    return currentName === entry.guest_name;
  }

  isInLeaderboard(): boolean {
    const currentName = this.guestService.guestName();
    return this.entries().some(e => e.guest_name === currentName);
  }
}
