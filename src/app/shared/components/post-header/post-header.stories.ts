import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostHeaderComponent } from './post-header.component';

const meta: Meta<PostHeaderComponent> = {
  title: 'Shared/Content/PostHeader',
  component: PostHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostHeaderComponent],
    }),
  ],
  argTypes: {
    authorName: { control: 'text', description: 'Szerző neve' },
    authorType: {
      control: 'select',
      options: ['contact', 'guest', 'user'],
      description: 'Szerző típusa',
    },
    createdAt: { control: 'text', description: 'Létrehozás ideje (ISO)' },
    isEdited: { control: 'boolean', description: 'Szerkesztve' },
    badgeText: { control: 'text', description: 'Egyedi badge szöveg' },
  },
};

export default meta;
type Story = StoryObj<PostHeaderComponent>;

/** Alapértelmezett - vendég */
export const Default: Story = {
  args: {
    authorName: 'Kiss Anna',
    authorType: 'guest',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isEdited: false,
  },
};

/** Kapcsolattartó - badge-dzsel */
export const Kapcsolattarto: Story = {
  args: {
    authorName: 'Nagy Péter',
    authorType: 'contact',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isEdited: false,
  },
};

/** Szerkesztett */
export const Szerkesztett: Story = {
  args: {
    authorName: 'Tóth Gábor',
    authorType: 'guest',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isEdited: true,
  },
};

/** Egyedi badge szöveggel */
export const EgyediBadge: Story = {
  args: {
    authorName: 'Kovács János',
    authorType: 'user',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    isEdited: false,
    badgeText: 'Osztályfőnök',
  },
};

/** Felhasználó típus */
export const Felhasznalo: Story = {
  args: {
    authorName: 'Szabó Eszter',
    authorType: 'user',
    createdAt: new Date(Date.now() - 60000).toISOString(),
    isEdited: false,
  },
};
