import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommentButtonComponent } from './comment-button.component';

const meta: Meta<CommentButtonComponent> = {
  title: 'Shared/ActionButtons/CommentButton',
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
      description: 'Megjelenítési mód',
    },
    label: {
      control: 'text',
      description: 'Gomb szöveg',
    },
    count: {
      control: { type: 'number', min: 0, max: 999 },
      description: 'Hozzászólások száma',
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

/** Alapértelmezett megjelenés (ikon + szöveg) */
export const Default: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    count: null,
    active: false,
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-comment-button [display]="display" [label]="label" [count]="count" [active]="active" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Aktív állapot (kiválasztott/megnyitott) */
export const Active: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    count: 5,
    active: true,
    disabled: false,
  },
};

/** Számmal (hozzászólások száma) */
export const WithCount: Story = {
  args: {
    display: 'icon-text',
    label: 'hozzászólás',
    count: 12,
    active: false,
    disabled: false,
  },
};

/** Csak ikon */
export const IconOnly: Story = {
  args: {
    display: 'icon-only',
    label: 'hozzászólás',
    count: null,
    active: false,
    disabled: false,
  },
};
