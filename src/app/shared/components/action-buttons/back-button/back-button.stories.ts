import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { BackButtonComponent } from './back-button.component';

const meta: Meta<BackButtonComponent> = {
  title: 'Shared/Actions/BackButton',
  component: BackButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [BackButtonComponent],
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
type Story = StoryObj<BackButtonComponent>;

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    display: 'icon-text',
    label: 'Vissza',
    disabled: false,
  },
};

/** Csak ikon */
export const IconOnly: Story = {
  args: {
    display: 'icon-only',
    label: 'Vissza',
    disabled: false,
  },
};

/** Csak szöveg */
export const TextOnly: Story = {
  args: {
    display: 'text-only',
    label: 'Vissza a listához',
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    display: 'icon-text',
    label: 'Vissza',
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    display: 'icon-text',
    label: 'Vissza',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
