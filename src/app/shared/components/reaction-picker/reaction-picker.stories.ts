import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ReactionPickerComponent } from './reaction-picker.component';

const meta: Meta<ReactionPickerComponent> = {
  title: 'Shared/UI/ReactionPicker',
  component: ReactionPickerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReactionPickerComponent],
    }),
  ],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
    userReaction: {
      control: 'text',
      description: 'Felhasználó saját reakciója',
    },
  },
};

export default meta;
type Story = StoryObj<ReactionPickerComponent>;

/** Alapértelmezett - nincs reakció */
export const Default: Story = {
  args: {
    reactions: {},
    userReaction: null,
    disabled: false,
  },
};

/** Reakciókkal */
export const WithReactions: Story = {
  args: {
    reactions: {
      '👍': 5,
      '❤️': 3,
      '😂': 1,
    },
    userReaction: null,
    disabled: false,
  },
};

/** Saját reakcióval */
export const WithUserReaction: Story = {
  args: {
    reactions: {
      '👍': 5,
      '❤️': 3,
    },
    userReaction: '👍',
    disabled: false,
  },
};

/** Sok reakció */
export const ManyReactions: Story = {
  args: {
    reactions: {
      '👍': 12,
      '❤️': 8,
      '😂': 5,
      '🎉': 3,
      '😮': 2,
      '😢': 1,
    },
    userReaction: '❤️',
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    reactions: {
      '👍': 3,
    },
    userReaction: null,
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    reactions: {
      '👍': 5,
      '❤️': 2,
    },
    userReaction: '👍',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
