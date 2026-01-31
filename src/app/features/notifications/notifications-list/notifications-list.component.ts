import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification, NotificationType } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationCardComponent } from '../notification-card/notification-card.component';
import { PokeDetailDialogComponent } from '../../../shared/components/poke-detail-dialog/poke-detail-dialog.component';
import { StaggerAnimationDirective } from '../../../shared/directives';

/**
 * Notifications List Component
 *
 * Értesítések lista:
 * - Összes értesítés megjelenítése
 * - Szűrés típus szerint (poke, reply, mention, like, badge)
 * - "Összes olvasottnak jelölése" funkció
 * - Skeleton loading states
 */
@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [
    CommonModule,
    NotificationCardComponent,
    PokeDetailDialogComponent,
    StaggerAnimationDirective
  ],
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsListComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Értesítések a service-ből */
  readonly notifications = this.notificationService.notifications;

  /** Betöltés állapot */
  readonly isLoading = this.notificationService.loading;

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Aktuális szűrő típus */
  readonly activeFilter = signal<NotificationType | 'all'>('all');

  /** Összes olvasottnak jelölés folyamatban */
  readonly isMarkingAllRead = signal<boolean>(false);

  /** Poke detail dialog megnyitva-e */
  readonly showPokeDialog = signal(false);

  /** Poke ID a dialoghoz */
  readonly pokeIdForDialog = signal<number | null>(null);

  /** Skeleton loader elemek száma */
  readonly skeletonCount = [1, 2, 3, 4, 5];

  /** Szűrt értesítések */
  readonly filteredNotifications = computed(() => {
    const filter = this.activeFilter();
    const all = this.notifications();

    if (filter === 'all') {
      return all;
    }

    return all.filter(n => n.type === filter);
  });

  /** Van-e olvasatlan értesítés? */
  readonly hasUnread = computed(() =>
    this.filteredNotifications().some(n => !n.is_read)
  );

  ngOnInit(): void {
    const project = this.authService.getProject();
    if (project) {
      this.loadNotifications(project.id);
    }
  }

  /**
   * Értesítések betöltése
   */
  private loadNotifications(projectId: number): void {
    this.errorMessage.set(null);

    this.notificationService.loadNotifications(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          this.errorMessage.set('Hiba történt az értesítések betöltésekor');
        }
      });
  }

  /**
   * Szűrő váltás
   */
  onFilterChange(filter: NotificationType | 'all'): void {
    this.activeFilter.set(filter);
  }

  /**
   * Összes olvasottnak jelölése
   */
  onMarkAllAsRead(): void {
    const project = this.authService.getProject();
    if (!project) return;

    if (!this.hasUnread()) {
      return; // Nincs olvasatlan, nem kell művelet
    }

    this.isMarkingAllRead.set(true);

    this.notificationService.markAllAsRead(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isMarkingAllRead.set(false);
        },
        error: () => {
          this.errorMessage.set('Hiba történt az olvasottnak jelöléskor');
          this.isMarkingAllRead.set(false);
        }
      });
  }

  /**
   * Értesítés kattintás - olvasottnak jelölés
   */
  onNotificationClick(notification: Notification): void {
    const project = this.authService.getProject();
    if (!project || notification.is_read) return;

    this.notificationService.markAsRead(project.id, notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * TrackBy notification id alapján
   */
  trackById(index: number, notification: Notification): number {
    return notification.id;
  }

  /**
   * Poke detail dialog megnyitása
   */
  onOpenPokeDialog(pokeId: number): void {
    this.pokeIdForDialog.set(pokeId);
    this.showPokeDialog.set(true);
  }

  /**
   * Poke detail dialog bezárása
   */
  onClosePokeDialog(): void {
    this.showPokeDialog.set(false);
    this.pokeIdForDialog.set(null);
  }
}
