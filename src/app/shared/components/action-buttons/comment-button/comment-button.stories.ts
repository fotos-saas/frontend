import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommentButtonComponent } from './comment-button.component';

const meta: Meta<CommentButtonComponent> = {
  title: 'Shared/Actions/CommentButton',
  component: CommentButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommentButtonComponent],
    }),
  ],
  argTypes: {
    display: {
      control: 'select',
      options: ['icon-text', 'icon-only', 'text-only'],
      description: 'Megjelenítés módja',
    },
    label: {
      control: 'text',
      description: 'Gomb szöveg',
    },
    active: {
      control: 'boolean',
      description: 'Aktív állapot',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<CommentButtonComponent>;

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    active: false,
    disabled: false,
  },
};

/** Aktív állapot */
export const Active: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    active: true,
    disabled: false,
  },
};

/** Csak ikon */
export const IconOnly: Story = {
  args: {
    display: 'icon-only',
    label: 'hozzászólás',
    active: false,
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    active: false,
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    active: false,
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
