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
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
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
