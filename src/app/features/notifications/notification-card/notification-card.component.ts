import { Component, input, output, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Notification, NotificationType } from '../../../core/services/notification.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Notification Card Component
 *
 * Egyedi értesítés kártya:
 * - Ikon típus szerint
 * - Cím és szöveg
 * - Relatív idő megjelenítés
 * - Olvasott/olvasatlan státusz vizualizáció
 */
@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="notification-card"
      [class.unread]="!notification().is_read"
      (click)="onCardClick()"
    >
      <div class="notification-icon" [class]="iconClass()">
        {{ iconEmoji() }}
      </div>

      <div class="notification-content">
        <h3 class="notification-title">{{ formattedTitle() }}</h3>
        <p class="notification-body">{{ formattedBody() }}</p>
        <span class="notification-time">{{ relativeTime() }}</span>
      </div>

      @if (!notification().is_read) {
        <div class="unread-indicator" title="Olvasatlan"></div>
      }
    </div>
  `,
  styleUrls: ['./notification-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCardComponent {
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  /** Trusted domains az action URL-ekhez (Open Redirect prevention) */
  private readonly trustedDomains = [
    window.location.hostname,
    'kepvalaszto.hu',
    'fotopack.kepvalaszto.hu',
    'admin.kepvalaszto.hu',
    'admin-fotopack.kepvalaszto.hu'
  ];

  /** Értesítés objektum */
  readonly notification = input.required<Notification>();

  /** Kattintás esemény (mark as read) */
  readonly clicked = output<Notification>();

  /** Poke dialog megnyitás esemény */
  readonly openPokeDialog = output<number>();

  /** Ikon emoji típus szerint */
  readonly iconEmoji = computed(() => {
    const type = this.notification().type;
    const emojiMap: Record<NotificationType, string> = {
      poke: '👉',
      poke_reaction: '👉',
      reply: '💬',
      mention: '📢',
      like: '❤️',
      badge: '🏆'
    };
    return emojiMap[type] || '🔔';
  });

  /** Ikon CSS osztály típus szerint */
  readonly iconClass = computed(() => {
    const type = this.notification().type;
    return `icon-${type}`;
  });

  /** Relatív időpont megjelenítése */
  readonly relativeTime = computed(() => {
    const createdAt = new Date(this.notification().created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays < 7) return `${diffDays} napja`;

    // 7 napnál régebbi - formázott dátum
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const day = String(createdAt.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.`;
  });

  /** Formázott title - poke_reaction esetén 👉 ikon */
  readonly formattedTitle = computed(() => {
    const notif = this.notification();
    if (notif.type === 'poke_reaction') {
      return '👉 Reakció a bökésedre!';
    }
    return notif.title;
  });

  /** Formázott body - poke_reaction esetén emojival */
  readonly formattedBody = computed(() => {
    const notif = this.notification();
    if (notif.type === 'poke_reaction') {
      const reaction = notif.data?.['reaction'] as string;
      const reactorName = notif.data?.['reactor_name'] as string || 'Valaki';
      if (reaction) {
        return `${reactorName} ${reaction} reagált a bökésedre`;
      }
    }
    return notif.body;
  });

  /**
   * Kártya kattintás kezelése
   */
  onCardClick(): void {
    const notif = this.notification();
    this.clicked.emit(notif);

    // Poke reakció esetén dialógust nyitunk (szülő kezeli)
    if (notif.type === 'poke_reaction') {
      const pokeId = notif.data?.['poke_id'] as number;
      if (pokeId) {
        this.openPokeDialog.emit(pokeId);
        return;
      }
    }

    if (notif.action_url) {
      this.safeNavigate(notif.action_url);
    }
  }

  /**
   * Biztonságos navigáció Open Redirect védelemmel.
   * Csak trusted domain-ekre enged navigálni, vagy relatív URL-ekre.
   */
  private safeNavigate(url: string): void {
    try {
      // Relatív URL check
      if (url.startsWith('/') && !url.startsWith('//')) {
        this.router.navigateByUrl(url);
        return;
      }

      // Abszolút URL validálás
      const parsedUrl = new URL(url, window.location.origin);

      if (this.trustedDomains.includes(parsedUrl.hostname)) {
        // Same-origin vagy trusted domain - biztonságos
        if (parsedUrl.origin === window.location.origin) {
          // Same-origin: használjuk a Router-t
          this.router.navigateByUrl(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash);
        } else {
          // Trusted external domain
          window.location.href = url;
        }
      } else {
        // Untrusted domain - logoljuk és ignoráljuk
        this.logger.warn('Blocked untrusted redirect URL', { url, hostname: parsedUrl.hostname });
      }
    } catch (e) {
      this.logger.error('Invalid notification action URL', e);
    }
  }
}
