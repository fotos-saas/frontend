import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { GamificationService } from '../../../core/services/gamification.service';
import { GuestService } from '../../../core/services/guest.service';

/**
 * User Rank Card Component
 *
 * Mutatja a felhasználó aktuális rangját, pontjait és a következő ranghoz
 * szükséges előrehaladást.
 */
@Component({
  selector: 'app-user-rank-card',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rank-card">
      @if (userStats()) {
        <!-- Rang és név -->
        <div class="rank-card__header">
          <div class="rank-card__level" [attr.data-level]="userStats()!.rank_level">
            <span class="rank-card__level-number">{{ userStats()!.rank_level }}</span>
          </div>
          <div class="rank-card__info">
            <span class="rank-card__name">{{ guestName() }}</span>
            <span class="rank-card__rank">{{ userStats()!.rank_name }}</span>
          </div>
          <div class="rank-card__points">
            <span class="rank-card__points-value">{{ userStats()!.total_points }}</span>
            <span class="rank-card__points-label">pont</span>
          </div>
        </div>

        <!-- Progress bar -->
        @if (userStats()!.next_rank_points) {
          <div class="rank-card__progress">
            <div class="rank-card__progress-header">
              <span class="rank-card__progress-label">Következő rang</span>
              <span class="rank-card__progress-target">
                {{ userStats()!.next_rank_points }} pont
              </span>
            </div>
            <div class="rank-card__progress-bar">
              <div
                class="rank-card__progress-fill"
                [style.width.%]="userStats()!.progress_to_next_rank"
              ></div>
            </div>
            <span class="rank-card__progress-percent">
              {{ userStats()!.progress_to_next_rank | number:'1.0-0' }}%
            </span>
          </div>
        } @else {
          <div class="rank-card__max-rank">
            <span>🎉 Elérted a legmagasabb rangot!</span>
          </div>
        }

        <!-- Stats -->
        <div class="rank-card__stats">
          <div class="rank-card__stat">
            <span class="rank-card__stat-value">{{ userStats()!.stats.posts }}</span>
            <span class="rank-card__stat-label">poszt</span>
          </div>
          <div class="rank-card__stat">
            <span class="rank-card__stat-value">{{ userStats()!.stats.replies }}</span>
            <span class="rank-card__stat-label">válasz</span>
          </div>
          <div class="rank-card__stat">
            <span class="rank-card__stat-value">{{ userStats()!.stats.likes_received }}</span>
            <span class="rank-card__stat-label">kapott like</span>
          </div>
          <div class="rank-card__stat">
            <span class="rank-card__stat-value">{{ userStats()!.stats.likes_given }}</span>
            <span class="rank-card__stat-label">adott like</span>
          </div>
        </div>
      } @else if (loading()) {
        <div class="rank-card__loading">
          <div class="rank-card__spinner"></div>
        </div>
      } @else {
        <div class="rank-card__empty">
          <p>Még nincs aktivitásod</p>
          <span>Írj hozzászólást a fórumba!</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .rank-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 20px;
      color: white;
    }

    .rank-card__header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .rank-card__level {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.4);

      &[data-level="6"] {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-color: #fcd34d;
      }

      &[data-level="5"] {
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
        border-color: #a78bfa;
      }

      &[data-level="4"] {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-color: #60a5fa;
      }
    }

    .rank-card__level-number {
      font-size: 24px;
      font-weight: 700;
    }

    .rank-card__info {
      flex: 1;
      min-width: 0;
    }

    .rank-card__name {
      display: block;
      font-size: 18px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rank-card__rank {
      display: block;
      font-size: 14px;
      opacity: 0.8;
      margin-top: 2px;
    }

    .rank-card__points {
      text-align: right;
    }

    .rank-card__points-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
    }

    .rank-card__points-label {
      display: block;
      font-size: 12px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .rank-card__progress {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }

    .rank-card__progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .rank-card__progress-label {
      font-size: 12px;
      opacity: 0.8;
    }

    .rank-card__progress-target {
      font-size: 12px;
      font-weight: 600;
    }

    .rank-card__progress-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .rank-card__progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .rank-card__progress-percent {
      font-size: 11px;
      opacity: 0.8;
    }

    .rank-card__max-rank {
      text-align: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .rank-card__stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .rank-card__stat {
      text-align: center;
      padding: 12px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .rank-card__stat-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
    }

    .rank-card__stat-label {
      display: block;
      font-size: 10px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .rank-card__loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .rank-card__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .rank-card__empty {
      text-align: center;
      padding: 32px 16px;

      p {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px;
      }

      span {
        font-size: 14px;
        opacity: 0.8;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class UserRankCardComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly guestService = inject(GuestService);

  /** Derived signals */
  readonly userStats = this.gamificationService.userStats;
  readonly loading = this.gamificationService.loading;
  readonly guestName = this.guestService.guestName;

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.gamificationService.fetchUserStats(projectId).subscribe();
    }
  }
}
