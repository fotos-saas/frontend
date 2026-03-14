import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { EditButtonComponent } from './edit-button.component';

const meta: Meta<EditButtonComponent> = {
  title: 'Shared/ActionButtons/EditButton',
  component: EditButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [EditButtonComponent],
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
type Story = StoryObj<EditButtonComponent>;

/** Alapértelmezett megjelenés (csak ikon) */
export const Default: Story = {
  args: {
    display: 'icon-only',
    label: 'Szerkesztés',
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-edit-button [display]="display" [label]="label" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Ikon + szöveg együtt */
export const WithLabel: Story = {
  args: {
    display: 'icon-text',
    label: 'Szerkesztés',
    disabled: false,
  },
};

/** Csak szöveg */
export const TextOnly: Story = {
  args: {
    display: 'text-only',
    label: 'Részletek szerkesztése',
    disabled: false,
  },
};
