import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError, of, forkJoin } from 'rxjs';
import { LoggerService } from './logger.service';

/**
 * Badge tier típusok
 */
export type BadgeTier = 'bronze' | 'silver' | 'gold';

/**
 * Badge interface
 */
export interface Badge {
  id: number;
  key: string;
  name: string;
  description: string;
  tier: BadgeTier;
  icon: string;
  color: string;
  points: number;
}

/**
 * User badge (megszerzett)
 */
export interface UserBadge {
  id: number;
  badge: Badge;
  earned_at: string;
  is_new: boolean;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  guest_name: string;
  points: number;
  rank_level: number;
  rank_name: string;
  stats?: {
    posts: number;
    replies: number;
    likes: number;
  };
}

/**
 * User rank info
 */
export interface UserRank {
  rank: number;
  total_users: number;
  percentile: number;
  points: number;
  rank_level: number;
  rank_name: string;
  badges_count: number;
}

/**
 * User stats
 */
export interface UserStats {
  total_points: number;
  rank_level: number;
  rank_name: string;
  next_rank_points: number | null;
  progress_to_next_rank: number;
  stats: {
    posts: number;
    replies: number;
    likes_received: number;
    likes_given: number;
  };
}

/**
 * Gamification Service
 *
 * Badge-ek, pontok, rangok és leaderboard kezelése.
 */
@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  /** User badges */
  readonly userBadges = signal<UserBadge[]>([]);

  /** Új (még nem látott) badges */
  readonly newBadges = signal<UserBadge[]>([]);

  /** User stats */
  readonly userStats = signal<UserStats | null>(null);

  /** User rank a leaderboardon */
  readonly userRank = signal<UserRank | null>(null);

  /** Leaderboard (top 10) */
  readonly leaderboard = signal<LeaderboardEntry[]>([]);

  /** Töltés állapotok */
  readonly loading = signal<boolean>(false);

  /** Computed: van új badge? */
  readonly hasNewBadges = computed(() => this.newBadges().length > 0);

  /** Computed: badges by tier */
  readonly badgesByTier = computed(() => {
    const badges = this.userBadges();
    return {
      gold: badges.filter(b => b.badge.tier === 'gold'),
      silver: badges.filter(b => b.badge.tier === 'silver'),
      bronze: badges.filter(b => b.badge.tier === 'bronze')
    };
  });

  /** Computed: progress to next rank percentage */
  readonly rankProgress = computed(() => {
    const stats = this.userStats();
    return stats?.progress_to_next_rank ?? 0;
  });

  /**
   * Összes gamification adat betöltése
   */
  loadAll(projectId: number): Observable<unknown> {
    this.loading.set(true);

    return forkJoin({
      stats: this.fetchUserStats(projectId),
      badges: this.fetchUserBadges(projectId),
      rank: this.fetchUserRank(projectId),
      leaderboard: this.fetchLeaderboard(projectId)
    }).pipe(
      tap(() => this.loading.set(false)),
      catchError(error => {
        this.logger.error('[Gamification] Load all error:', error);
        this.loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * User stats betöltése
   */
  fetchUserStats(projectId: number): Observable<UserStats | null> {
    return this.http.get<{ success: boolean; data: UserStats }>(
      `${environment.apiUrl}/tablo-frontend/gamification/stats`
    ).pipe(
      tap(response => {
        if (response.success) {
          this.userStats.set(response.data);
        }
      }),
      catchError(error => {
        this.logger.error('[Gamification] Stats error:', error);
        return of(null);
      })
    ) as Observable<UserStats | null>;
  }

  /**
   * User badges betöltése
   */
  fetchUserBadges(projectId: number): Observable<UserBadge[]> {
    return this.http.get<{ success: boolean; data: { badges: UserBadge[]; new_badges: UserBadge[] } }>(
      `${environment.apiUrl}/tablo-frontend/gamification/badges`
    ).pipe(
      tap(response => {
        if (response.success) {
          this.userBadges.set(response.data.badges);
          this.newBadges.set(response.data.new_badges);
        }
      }),
      catchError(error => {
        this.logger.error('[Gamification] Badges error:', error);
        return of([]);
      })
    ) as Observable<UserBadge[]>;
  }

  /**
   * User rank betöltése
   */
  fetchUserRank(projectId: number): Observable<UserRank | null> {
    return this.http.get<{ success: boolean; data: UserRank | null }>(
      `${environment.apiUrl}/tablo-frontend/gamification/rank`
    ).pipe(
      tap(response => {
        if (response.success) {
          this.userRank.set(response.data);
        }
      }),
      catchError(error => {
        this.logger.error('[Gamification] Rank error:', error);
        return of(null);
      })
    ) as Observable<UserRank | null>;
  }

  /**
   * Leaderboard betöltése
   */
  fetchLeaderboard(projectId: number, type: 'points' | 'posts' | 'likes' = 'points'): Observable<LeaderboardEntry[]> {
    return this.http.get<{ success: boolean; data: LeaderboardEntry[] }>(
      `${environment.apiUrl}/tablo-frontend/gamification/leaderboard`,
      { params: { type, limit: '10' } }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.leaderboard.set(response.data);
        }
      }),
      catchError(error => {
        this.logger.error('[Gamification] Leaderboard error:', error);
        return of([]);
      })
    ) as Observable<LeaderboardEntry[]>;
  }

  /**
   * Új badges megtekintettnek jelölése
   */
  markBadgesAsViewed(projectId: number): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/tablo-frontend/gamification/badges/viewed`,
      {}
    ).pipe(
      tap(() => {
        // Helyi state frissítése
        const badges = this.userBadges();
        const updated = badges.map(b => ({ ...b, is_new: false }));
        this.userBadges.set(updated);
        this.newBadges.set([]);
      }),
      catchError(error => {
        this.logger.error('[Gamification] Mark viewed error:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Rang név lekérése szint alapján
   */
  getRankName(level: number): string {
    const ranks: Record<number, string> = {
      1: 'Újonc',
      2: 'Tag',
      3: 'Aktív tag',
      4: 'Veterán',
      5: 'Mester',
      6: 'Legenda'
    };
    return ranks[level] || 'Ismeretlen';
  }

  /**
   * Tier szín lekérése
   */
  getTierColor(tier: BadgeTier): string {
    const colors: Record<BadgeTier, string> = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700'
    };
    return colors[tier];
  }

  /**
   * Tier label
   */
  getTierLabel(tier: BadgeTier): string {
    const labels: Record<BadgeTier, string> = {
      bronze: 'Bronz',
      silver: 'Ezüst',
      gold: 'Arany'
    };
    return labels[tier];
  }

  /**
   * Badge hozzáadása (lokálisan, real-time-ból)
   */
  addBadgeLocally(userBadge: UserBadge): void {
    const current = this.userBadges();
    this.userBadges.set([userBadge, ...current]);

    if (userBadge.is_new) {
      const currentNew = this.newBadges();
      this.newBadges.set([userBadge, ...currentNew]);
    }
  }

  /**
   * Pontok frissítése (lokálisan)
   */
  updatePointsLocally(points: number): void {
    const stats = this.userStats();
    if (stats) {
      this.userStats.set({
        ...stats,
        total_points: stats.total_points + points
      });
    }
  }

  /**
   * Reset state
   */
  clear(): void {
    this.userBadges.set([]);
    this.newBadges.set([]);
    this.userStats.set(null);
    this.userRank.set(null);
    this.leaderboard.set([]);
  }
}
