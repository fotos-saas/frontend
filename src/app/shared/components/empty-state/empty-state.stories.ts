import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  title: 'Shared/UI/EmptyState',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [EmptyStateComponent],
    }),
  ],
  argTypes: {
    emoji: {
      control: 'text',
      description: 'Emoji ikon',
    },
    message: {
      control: 'text',
      description: 'Üzenet szöveg',
    },
    buttonText: {
      control: 'text',
      description: 'Gomb szöveg (opcionális)',
    },
    compact: {
      control: 'boolean',
      description: 'Kompakt megjelenés',
    },
  },
};

export default meta;
type Story = StoryObj<EmptyStateComponent>;

/** Alapértelmezett - csak üzenet */
export const Default: Story = {
  args: {
    message: 'Még nincs elem a listában',
  },
};

/** Emojival */
export const WithEmoji: Story = {
  args: {
    emoji: '📭',
    message: 'még nem kaptál bökést',
  },
};

/** Gombbal */
export const WithButton: Story = {
  args: {
    emoji: '📷',
    message: 'még nincsenek feltöltött képek',
    buttonText: 'képek feltöltése',
  },
};

/** Kompakt változat */
export const Compact: Story = {
  args: {
    emoji: '🔍',
    message: 'nincs találat a keresésre',
    compact: true,
  },
};

/** Kompakt gombbal */
export const CompactWithButton: Story = {
  args: {
    emoji: '📝',
    message: 'még nincsenek projektek',
    buttonText: 'új projekt',
    compact: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    emoji: '📭',
    message: 'még nincs elem a listában',
    buttonText: 'hozzáadás',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
