import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostHeaderBarComponent, BadgeConfig } from './post-header-bar.component';

const meta: Meta<PostHeaderBarComponent> = {
  title: 'Shared/Content/PostHeaderBar',
  component: PostHeaderBarComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostHeaderBarComponent],
    }),
  ],
  argTypes: {
    badges: { control: 'object', description: 'Badge-ek listája' },
    isPinned: { control: 'boolean', description: 'Kitűzött' },
    showActions: { control: 'boolean', description: 'Action gombok megjelenítése' },
    showPinAction: { control: 'boolean', description: 'Pin gomb megjelenítése' },
    showEditDelete: { control: 'boolean', description: 'Edit/Delete gombok' },
  },
};

export default meta;
type Story = StoryObj<PostHeaderBarComponent>;

/** Alapértelmezett - badge nélkül */
export const Default: Story = {
  args: {
    badges: [],
    isPinned: false,
    showActions: false,
    showPinAction: false,
    showEditDelete: false,
  },
};

/** Bejelentés badge */
export const Bejelentes: Story = {
  args: {
    badges: [{ type: 'announcement', label: 'Bejelentés', icon: 'announcement', color: 'primary' }] as BadgeConfig[],
    isPinned: false,
    showActions: false,
  },
};

/** Esemény badge */
export const Esemeny: Story = {
  args: {
    badges: [{ type: 'event', label: 'Esemény', icon: 'calendar', color: 'purple' }] as BadgeConfig[],
    isPinned: false,
    showActions: false,
  },
};

/** Kitűzött poszt */
export const Kituzott: Story = {
  args: {
    badges: [{ type: 'pinned', label: 'Kitűzött', icon: 'pin', color: 'warning' }] as BadgeConfig[],
    isPinned: true,
    showActions: false,
  },
};

/** Több badge */
export const TobbBadge: Story = {
  args: {
    badges: [
      { type: 'announcement', label: 'Bejelentés', icon: 'announcement', color: 'primary' },
      { type: 'pinned', label: 'Kitűzött', icon: 'pin', color: 'warning' },
    ] as BadgeConfig[],
    isPinned: true,
    showActions: false,
  },
};

/** Akciógombokkal */
export const AkcioGombokkal: Story = {
  args: {
    badges: [{ type: 'announcement', label: 'Bejelentés', icon: 'announcement', color: 'primary' }] as BadgeConfig[],
    isPinned: false,
    showActions: true,
    showPinAction: true,
    showEditDelete: true,
  },
};

/** Lezárt poszt */
export const Lezart: Story = {
  args: {
    badges: [{ type: 'locked', label: 'Lezárt', icon: 'lock', color: 'gray' }] as BadgeConfig[],
    isPinned: false,
    showActions: false,
  },
};
