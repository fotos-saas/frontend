import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PartnerNotificationBellComponent } from './partner-notification-bell.component';
import { PartnerNotificationService, PartnerNotification } from '../../../../core/services/partner-notification.service';
import { LoggerService } from '../../../../core/services/logger.service';

/**
 * Mock PartnerNotificationService a story-khoz.
 */
class MockPartnerNotificationService {
  notifications = signal<PartnerNotification[]>([]);
  unreadCount = signal(0);
  hasUnread = computed(() => this.unreadCount() > 0);
  loading = signal(false);
  startPolling(): void {}
  stopPolling(): void {}
  loadNotifications(): void {}
  markAsRead(): void {}
  markAllAsRead(): void {}
  refreshUnreadCount(): void {}
  clear(): void {}
}

class MockPartnerNotificationServiceWithUnread extends MockPartnerNotificationService {
  override notifications = signal<PartnerNotification[]>([
    {
      id: 1,
      type: 'task_assigned',
      title: 'Kiss Péter feladatot osztott ki neked',
      message: 'Csoportkép retusálás',
      emoji: '📋',
      action_url: '/partner/projects/1?tab=tasks',
      metadata: null,
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      type: 'question_answered',
      title: 'Nagy Anna megválaszolta a kérdésedet',
      message: 'Melyik hátteret válasszuk?',
      emoji: '💬',
      action_url: '/partner/projects/2?tab=tasks',
      metadata: null,
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      type: 'task_completed',
      title: 'Szabó Gábor elkészült egy feladattal',
      message: 'Portré háttércsere',
      emoji: '✅',
      action_url: null,
      metadata: null,
      is_read: true,
      read_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  override unreadCount = signal(2);
  override hasUnread = computed(() => this.unreadCount() > 0);
}

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

const meta: Meta<PartnerNotificationBellComponent> = {
  title: 'Partner/PartnerNotificationBell',
  component: PartnerNotificationBellComponent,
  decorators: [
    moduleMetadata({
      imports: [RouterModule.forChild([])],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<PartnerNotificationBellComponent>;

/** Alapértelmezett állapot - nincs értesítés */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationService },
      ],
    }),
  ],
};

/** Olvasatlan értesítésekkel */
export const WithUnread: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationServiceWithUnread },
      ],
    }),
  ],
};

/** Sötét háttéren (dark mode vizuális teszt) */
export const DarkMode: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationServiceWithUnread },
      ],
    }),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Akadálymentességi teszt */
export const A11y: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationServiceWithUnread },
      ],
    }),
  ],
  parameters: {
    a11y: { disable: false },
  },
};
