import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import {
  GamificationService,
  UserBadge,
  BadgeTier
} from '../../../core/services/gamification.service';
import { GuestService } from '../../../core/services/guest.service';

/**
 * Badge Display Component
 *
 * Felhasználó badge-einek megjelenítése, csoportosítva tier szerint.
 */
@Component({
  selector: 'app-badge-display',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badges">
      <!-- Header -->
      <div class="badges__header">
        <h3 class="badges__title">
          <svg class="badges__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Kitűzők
        </h3>
        @if (hasNewBadges()) {
          <span class="badges__new-count">{{ newCount() }} új!</span>
        }
      </div>

      <!-- Content -->
      <div class="badges__content">
        @if (loading()) {
          <div class="badges__loading">
            <div class="badges__spinner"></div>
          </div>
        } @else if (badges().length === 0) {
          <div class="badges__empty">
            <svg class="badges__empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Még nincs kitűződ</p>
            <span>Aktív fórum részvétellel szerezhetsz!</span>
          </div>
        } @else {
          <!-- Gold badges -->
          @if (goldBadges().length > 0) {
            <div class="badges__tier badges__tier--gold">
              <h4 class="badges__tier-title">
                <span class="badges__tier-icon">🏆</span>
                Arany
              </h4>
              <div class="badges__grid">
                @for (userBadge of goldBadges(); track userBadge.id) {
                  <div
                    class="badges__item"
                    [class.badges__item--new]="userBadge.is_new"
                    (click)="onBadgeClick(userBadge)"
                  >
                    <div class="badges__item-icon badges__item-icon--gold">
                      <span>⭐</span>
                    </div>
                    <span class="badges__item-name">{{ userBadge.badge.name }}</span>
                    @if (userBadge.is_new) {
                      <span class="badges__item-new">ÚJ</span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Silver badges -->
          @if (silverBadges().length > 0) {
            <div class="badges__tier badges__tier--silver">
              <h4 class="badges__tier-title">
                <span class="badges__tier-icon">🥈</span>
                Ezüst
              </h4>
              <div class="badges__grid">
                @for (userBadge of silverBadges(); track userBadge.id) {
                  <div
                    class="badges__item"
                    [class.badges__item--new]="userBadge.is_new"
                    (click)="onBadgeClick(userBadge)"
                  >
                    <div class="badges__item-icon badges__item-icon--silver">
                      <span>⭐</span>
                    </div>
                    <span class="badges__item-name">{{ userBadge.badge.name }}</span>
                    @if (userBadge.is_new) {
                      <span class="badges__item-new">ÚJ</span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Bronze badges -->
          @if (bronzeBadges().length > 0) {
            <div class="badges__tier badges__tier--bronze">
              <h4 class="badges__tier-title">
                <span class="badges__tier-icon">🥉</span>
                Bronz
              </h4>
              <div class="badges__grid">
                @for (userBadge of bronzeBadges(); track userBadge.id) {
                  <div
                    class="badges__item"
                    [class.badges__item--new]="userBadge.is_new"
                    (click)="onBadgeClick(userBadge)"
                  >
                    <div class="badges__item-icon badges__item-icon--bronze">
                      <span>⭐</span>
                    </div>
                    <span class="badges__item-name">{{ userBadge.badge.name }}</span>
                    @if (userBadge.is_new) {
                      <span class="badges__item-new">ÚJ</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>

    <!-- Badge detail modal -->
    @if (selectedBadge()) {
      <div class="badges__modal-backdrop" (click)="closeBadgeDetail()">
        <div class="badges__modal" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="badges__modal-close"
            (click)="closeBadgeDetail()"
            aria-label="Bezárás"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            class="badges__modal-icon"
            [class.badges__modal-icon--gold]="selectedBadge()!.badge.tier === 'gold'"
            [class.badges__modal-icon--silver]="selectedBadge()!.badge.tier === 'silver'"
            [class.badges__modal-icon--bronze]="selectedBadge()!.badge.tier === 'bronze'"
          >
            <span>⭐</span>
          </div>

          <h3 class="badges__modal-title">{{ selectedBadge()!.badge.name }}</h3>
          <span class="badges__modal-tier">{{ getTierLabel(selectedBadge()!.badge.tier) }}</span>
          <p class="badges__modal-description">{{ selectedBadge()!.badge.description }}</p>

          <div class="badges__modal-info">
            <div class="badges__modal-info-item">
              <span class="badges__modal-info-label">Pont érték</span>
              <span class="badges__modal-info-value">+{{ selectedBadge()!.badge.points }}</span>
            </div>
            <div class="badges__modal-info-item">
              <span class="badges__modal-info-label">Megszerzés</span>
              <span class="badges__modal-info-value">{{ formatDate(selectedBadge()!.earned_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .badges {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .badges__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .badges__title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .badges__icon {
      width: 24px;
      height: 24px;
      color: #f59e0b;
    }

    .badges__new-count {
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      background: #ef4444;
      border-radius: 12px;
      animation: pulse 2s ease-in-out infinite;
    }

    .badges__content {
      padding: 20px;
    }

    .badges__loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .badges__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .badges__empty {
      text-align: center;
      padding: 32px;
      color: #6b7280;

      p {
        font-size: 16px;
        font-weight: 500;
        margin: 16px 0 8px;
        color: #374151;
      }

      span {
        font-size: 14px;
      }
    }

    .badges__empty-icon {
      width: 48px;
      height: 48px;
      color: #d1d5db;
    }

    .badges__tier {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .badges__tier-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badges__tier-icon {
      font-size: 16px;
    }

    .badges__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }

    .badges__item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 12px;
      background: #f9fafb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f3f4f6;
        transform: translateY(-2px);
      }

      &--new {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        animation: glow 2s ease-in-out infinite;

        &:hover {
          background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
        }
      }
    }

    .badges__item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      font-size: 24px;

      &--gold {
        background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      }

      &--silver {
        background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%);
        box-shadow: 0 4px 12px rgba(156, 163, 175, 0.3);
      }

      &--bronze {
        background: linear-gradient(135deg, #fbbf24 0%, #b45309 100%);
        box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);
      }
    }

    .badges__item-name {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      text-align: center;
      line-height: 1.3;
    }

    .badges__item-new {
      position: absolute;
      top: -4px;
      right: -4px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 700;
      color: white;
      background: #ef4444;
      border-radius: 8px;
    }

    /* Modal */
    .badges__modal-backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .badges__modal {
      position: relative;
      width: 90%;
      max-width: 360px;
      padding: 32px 24px;
      background: white;
      border-radius: 20px;
      text-align: center;
      animation: scaleIn 0.2s ease;
    }

    .badges__modal-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: #f3f4f6;
      }

      svg {
        width: 20px;
        height: 20px;
        color: #6b7280;
      }
    }

    .badges__modal-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      font-size: 40px;
      margin-bottom: 16px;

      &--gold {
        background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
        box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
      }

      &--silver {
        background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%);
        box-shadow: 0 8px 24px rgba(156, 163, 175, 0.4);
      }

      &--bronze {
        background: linear-gradient(135deg, #fbbf24 0%, #b45309 100%);
        box-shadow: 0 8px 24px rgba(180, 83, 9, 0.4);
      }
    }

    .badges__modal-title {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .badges__modal-tier {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      background: #f3f4f6;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .badges__modal-description {
      margin: 0 0 24px;
      font-size: 14px;
      line-height: 1.5;
      color: #6b7280;
    }

    .badges__modal-info {
      display: flex;
      justify-content: center;
      gap: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .badges__modal-info-item {
      text-align: center;
    }

    .badges__modal-info-label {
      display: block;
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .badges__modal-info-value {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @keyframes glow {
      0%, 100% { box-shadow: 0 0 8px rgba(251, 191, 36, 0.4); }
      50% { box-shadow: 0 0 16px rgba(251, 191, 36, 0.6); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class BadgeDisplayComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly guestService = inject(GuestService);

  /** Compact mode */
  readonly compact = input<boolean>(false);

  /** Badge click event */
  readonly badgeClicked = output<UserBadge>();

  /** Selected badge for modal */
  readonly selectedBadge = signal<UserBadge | null>(null);

  /** Derived signals */
  readonly badges = this.gamificationService.userBadges;
  readonly badgesByTier = this.gamificationService.badgesByTier;
  readonly hasNewBadges = this.gamificationService.hasNewBadges;
  readonly loading = this.gamificationService.loading;

  readonly goldBadges = () => this.badgesByTier().gold;
  readonly silverBadges = () => this.badgesByTier().silver;
  readonly bronzeBadges = () => this.badgesByTier().bronze;
  readonly newCount = () => this.gamificationService.newBadges().length;

  ngOnInit(): void {
    this.loadBadges();
  }

  private loadBadges(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.gamificationService.fetchUserBadges(projectId).subscribe();
    }
  }

  onBadgeClick(userBadge: UserBadge): void {
    this.selectedBadge.set(userBadge);
    this.badgeClicked.emit(userBadge);
  }

  closeBadgeDetail(): void {
    this.selectedBadge.set(null);
  }

  getTierLabel(tier: BadgeTier): string {
    return this.gamificationService.getTierLabel(tier);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
