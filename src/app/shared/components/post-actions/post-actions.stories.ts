import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostActionsComponent } from './post-actions.component';

const meta: Meta<PostActionsComponent> = {
  title: 'Shared/Content/PostActions',
  component: PostActionsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostActionsComponent],
    }),
  ],
  argTypes: {
    reactions: { control: 'object', description: 'Reakciók összesítése' },
    userReaction: { control: 'text', description: 'Felhasználó reakciója' },
    canReply: { control: 'boolean', description: 'Válasz gomb látható' },
    canEdit: { control: 'boolean', description: 'Szerkesztés gomb látható' },
    canDelete: { control: 'boolean', description: 'Törlés gomb látható' },
    remainingEditTime: { control: 'text', description: 'Hátralévő szerkesztési idő' },
  },
};

export default meta;
type Story = StoryObj<PostActionsComponent>;

/** Alapértelmezett - csak reakciók */
export const Default: Story = {
  args: {
    reactions: {},
    userReaction: null,
    canReply: false,
    canEdit: false,
    canDelete: false,
  },
};

/** Válasz gombbal */
export const ValaszGombbal: Story = {
  args: {
    reactions: { '👍': 2 },
    userReaction: null,
    canReply: true,
    canEdit: false,
    canDelete: false,
  },
};

/** Minden művelet */
export const MindenMuvelet: Story = {
  args: {
    reactions: { '👍': 5, '❤️': 2, '😂': 1 },
    userReaction: '👍',
    canReply: true,
    canEdit: true,
    canDelete: true,
  },
};

/** Csak szerkesztés és törlés */
export const SzerkesztesEsTorles: Story = {
  args: {
    reactions: {},
    userReaction: null,
    canReply: false,
    canEdit: true,
    canDelete: true,
  },
};

/** Felhasználó reakcióval */
export const FelhasznaloReakcioval: Story = {
  args: {
    reactions: { '❤️': 3, '👍': 1 },
    userReaction: '❤️',
    canReply: true,
    canEdit: false,
    canDelete: false,
  },
};
