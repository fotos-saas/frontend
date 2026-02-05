import {
  Component,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  templateUrl: './badge-display.component.html',
  styleUrl: './badge-display.component.scss'
})
export class BadgeDisplayComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly guestService = inject(GuestService);
  private readonly destroyRef = inject(DestroyRef);

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

  private loadBadges(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.gamificationService
        .fetchUserBadges(projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }
}
