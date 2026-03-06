import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ReplyButtonComponent } from './reply-button.component';

const meta: Meta<ReplyButtonComponent> = {
  title: 'Shared/Actions/ReplyButton',
  component: ReplyButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReplyButtonComponent],
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
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<ReplyButtonComponent>;

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    display: 'icon-text',
    label: 'Válasz',
    disabled: false,
  },
};

/** Csak ikon */
export const IconOnly: Story = {
  args: {
    display: 'icon-only',
    label: 'Válasz',
    disabled: false,
  },
};

/** Csak szöveg */
export const TextOnly: Story = {
  args: {
    display: 'text-only',
    label: 'Válaszolok',
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    display: 'icon-text',
    label: 'Válasz',
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    display: 'icon-text',
    label: 'Válasz',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
