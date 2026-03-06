import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { NotificationItemComponent } from './notification-item.component';

const meta: Meta<NotificationItemComponent> = {
  title: 'Shared/Content/NotificationItem',
  component: NotificationItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [NotificationItemComponent],
    }),
  ],
  argTypes: {
    formattedTime: { control: 'text', description: 'Formázott idő' },
  },
};

export default meta;
type Story = StoryObj<NotificationItemComponent>;

/** Alapértelmezett - olvasatlan */
export const Default: Story = {
  args: {
    notification: {
      id: 1,
      type: 'mention',
      title: 'Értesítés',
      body: 'Új hozzászólás érkezett a projekt fórumában.',
      data: {},
      action_url: '/forum/1',
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
    formattedTime: '10 perce',
  },
};

/** Olvasott */
export const Olvasott: Story = {
  args: {
    notification: {
      id: 2,
      type: 'reply',
      title: 'Válasz',
      body: 'Kiss Anna válaszolt a hozzászólásodra.',
      data: {},
      action_url: '/forum/1',
      is_read: true,
      read_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    formattedTime: '1 órája',
  },
};

/** Említés */
export const Emlites: Story = {
  args: {
    notification: {
      id: 3,
      type: 'mention',
      title: 'Említés',
      body: 'Nagy Péter megemlített egy hozzászólásban.',
      data: {},
      action_url: '/forum/2',
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    formattedTime: '30 perce',
  },
};

/** Kedvelés */
export const Kedveles: Story = {
  args: {
    notification: {
      id: 4,
      type: 'like',
      title: 'Kedvelés',
      body: 'Szabó Eszter kedvelte a hozzászólásodat.',
      data: {},
      action_url: null,
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    formattedTime: '1 napja',
  },
};

/** Bökés */
export const Bokes: Story = {
  args: {
    notification: {
      id: 5,
      type: 'poke',
      title: 'Bökés',
      body: 'Tóth Gábor bökött téged!',
      data: {},
      action_url: null,
      is_read: true,
      read_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    formattedTime: '2 napja',
  },
};

/** Bökés reakció */
export const BokesReakcio: Story = {
  args: {
    notification: {
      id: 6,
      type: 'poke_reaction',
      title: 'Bökés reakció',
      body: '',
      data: { reaction: '😂', reactor_name: 'Molnár Zsófi' },
      action_url: null,
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    formattedTime: '5 perce',
  },
};
