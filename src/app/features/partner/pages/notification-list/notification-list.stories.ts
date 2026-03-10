import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { signal, computed } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NotificationListComponent } from './notification-list.component';
import { PartnerNotificationService, PartnerNotification } from '../../../../core/services/partner-notification.service';
import { LoggerService } from '../../../../core/services/logger.service';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

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

const sampleNotifications: PartnerNotification[] = [
  {
    id: 1,
    type: 'task_assigned',
    title: 'Kiss Péter feladatot osztott ki neked',
    message: 'Csoportkép retusálás - háttér javítása szükséges',
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
    message: 'Melyik hátteret válasszuk a végső változathoz?',
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
    message: 'Portré háttércsere - 12.A osztály',
    emoji: '✅',
    action_url: '/partner/projects/3?tab=tasks',
    metadata: null,
    is_read: true,
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'task_reviewed',
    title: 'Kovács András jóváhagyta a munkádat',
    message: 'Egyéni portré retusálás',
    emoji: '👍',
    action_url: null,
    metadata: null,
    is_read: true,
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

class MockPartnerNotificationServiceWithData extends MockPartnerNotificationService {
  override unreadCount = signal(2);
  override hasUnread = computed(() => this.unreadCount() > 0);
}

const meta: Meta<NotificationListComponent> = {
  title: 'Partner/NotificationList',
  component: NotificationListComponent,
  decorators: [
    moduleMetadata({
      imports: [HttpClientModule, RouterModule.forChild([])],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<NotificationListComponent>;

/** Alapértelmezett - nincs értesítés */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationService },
      ],
    }),
  ],
};

/** Értesítésekkel */
export const WithNotifications: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationServiceWithData },
      ],
    }),
  ],
};

/** Sötét háttéren */
export const DarkMode: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationServiceWithData },
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
        { provide: PartnerNotificationService, useClass: MockPartnerNotificationServiceWithData },
      ],
    }),
  ],
  parameters: {
    a11y: { disable: false },
  },
};
