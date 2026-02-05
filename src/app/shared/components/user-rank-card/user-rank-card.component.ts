import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-rank-card.component.html',
  styleUrls: ['./user-rank-card.component.scss']
})
export class UserRankCardComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly guestService = inject(GuestService);
  private readonly destroyRef = inject(DestroyRef);

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
      this.gamificationService.fetchUserStats(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }
}
