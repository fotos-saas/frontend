import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReplyButtonComponent } from './reply-button.component';

const meta: Meta<ReplyButtonComponent> = {
  title: 'Shared/ActionButtons/ReplyButton',
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
type Story = StoryObj<ReplyButtonComponent>;

/** Alapértelmezett megjelenés (ikon + szöveg) */
export const Default: Story = {
  args: {
    display: 'icon-text',
    label: 'Válasz',
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-reply-button [display]="display" [label]="label" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
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
    label: 'Válasz írása',
    disabled: false,
  },
};
