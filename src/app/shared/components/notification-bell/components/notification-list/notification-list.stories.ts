import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { NotificationListComponent } from './notification-list.component';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'badge' as const,
    title: 'Új hozzászólás',
    body: 'Kiss Anna új hozzászólást írt a projekt fórumában.',
    data: {},
    action_url: '/forum/1',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 2,
    type: 'reply' as const,
    title: 'Válasz',
    body: 'Nagy Péter válaszolt a hozzászólásodra a tablóval kapcsolatban.',
    data: {},
    action_url: '/forum/1/reply/5',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    type: 'like' as const,
    title: 'Kedvelés',
    body: 'Szabó Eszter kedvelte a hozzászólásodat.',
    data: {},
    action_url: null,
    is_read: true,
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4,
    type: 'mention' as const,
    title: 'Említés',
    body: 'Tóth Gábor megemlített: "Kérdezd meg @téged a határidőről"',
    data: {},
    action_url: '/forum/3',
    is_read: true,
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const meta: Meta<NotificationListComponent> = {
  title: 'Shared/Content/NotificationList',
  component: NotificationListComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [NotificationListComponent],
    }),
  ],
};

export default meta;
type Story = StoryObj<NotificationListComponent>;

/** Alapértelmezett - értesítés listával */
export const Default: Story = {
  args: {
    notifications: MOCK_NOTIFICATIONS,
    loading: false,
  },
};

/** Betöltés állapot */
export const Betoltes: Story = {
  args: {
    notifications: [],
    loading: true,
  },
};

/** Üres lista */
export const UresLista: Story = {
  args: {
    notifications: [],
    loading: false,
  },
};

/** Csak olvasatlan */
export const CsakOlvasatlan: Story = {
  args: {
    notifications: MOCK_NOTIFICATIONS.filter(n => !n.is_read),
    loading: false,
  },
};
