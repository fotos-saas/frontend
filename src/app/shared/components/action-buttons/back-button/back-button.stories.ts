import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { BackButtonComponent } from './back-button.component';

const meta: Meta<BackButtonComponent> = {
  title: 'Shared/ActionButtons/BackButton',
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
      description: 'Megjelenítési mód',
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

/** Alapértelmezett megjelenés (ikon + szöveg) */
export const Default: Story = {
  args: {
    display: 'icon-text',
    label: 'Vissza',
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: { ...Default.args },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-back-button [display]="display" [label]="label" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
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

/** Egyedi szöveggel */
export const CustomLabel: Story = {
  args: {
    display: 'icon-text',
    label: 'Vissza a projektekhez',
    disabled: false,
  },
};
