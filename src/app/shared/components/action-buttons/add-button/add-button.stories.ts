import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { AddButtonComponent } from './add-button.component';

const meta: Meta<AddButtonComponent> = {
  title: 'Shared/ActionButtons/AddButton',
  component: AddButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AddButtonComponent, LucideAngularModule.pick({ Plus })],
    }),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'compact', 'ghost'],
      description: 'Gomb megjelenés stílusa',
    },
    size: {
      control: { type: 'number', min: 12, max: 32 },
      description: 'Ikon méret pixelben',
    },
    label: {
      control: 'text',
      description: 'Gomb szöveg',
    },
    display: {
      control: 'select',
      options: ['icon-text', 'icon-only', 'text-only'],
      description: 'Szöveg megjelenítés módja',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<AddButtonComponent>;

/** Alapértelmezett megjelenés (primary variáns, ikon + szöveg) */
export const Default: Story = {
  args: {
    variant: 'primary',
    label: 'Új',
    size: 18,
    display: 'icon-text',
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-add-button [variant]="variant" [label]="label" [size]="size" [display]="display" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Compact variáns (kisebb méret) */
export const Compact: Story = {
  args: {
    variant: 'compact',
    label: 'Hozzáadás',
    size: 16,
    display: 'icon-text',
    disabled: false,
  },
};

/** Ghost variáns (áttetsző háttér) */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Új elem',
    size: 18,
    display: 'icon-text',
    disabled: false,
  },
};

/** Csak ikon, szöveg nélkül */
export const IconOnly: Story = {
  args: {
    variant: 'primary',
    label: 'Új',
    size: 18,
    display: 'icon-only',
    disabled: false,
  },
};

/** Egyedi szöveggel */
export const CustomLabel: Story = {
  args: {
    variant: 'primary',
    label: 'Új projekt',
    size: 18,
    display: 'icon-text',
    disabled: false,
  },
};
