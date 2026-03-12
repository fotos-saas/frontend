import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, QrCode } from 'lucide-angular';
import { QrButtonComponent } from './qr-button.component';

const meta: Meta<QrButtonComponent> = {
  title: 'Shared/ActionButtons/QrButton',
  component: QrButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [QrButtonComponent, LucideAngularModule.pick({ QrCode })],
    }),
  ],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Van-e aktív QR kód a projekthez',
    },
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'icon-only'],
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
type Story = StoryObj<QrButtonComponent>;

/** Alapértelmezett megjelenés (icon-only variáns, inaktív) */
export const Default: Story = {
  args: {
    isActive: false,
    variant: 'icon-only',
    size: 18,
    label: 'QR Kód',
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-qr-button [isActive]="isActive" [variant]="variant" [size]="size" [label]="label" [display]="display" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Aktív QR kód (tooltip: "QR kód megtekintése") */
export const Active: Story = {
  args: {
    isActive: true,
    variant: 'icon-only',
    size: 18,
    label: 'QR Kód',
    display: 'icon-text',
    disabled: false,
  },
};

/** Primary variáns (kitöltött gomb) */
export const Primary: Story = {
  args: {
    isActive: false,
    variant: 'primary',
    size: 18,
    label: 'QR Kód generálása',
    display: 'icon-text',
    disabled: false,
  },
};

/** Ghost variáns (áttetsző) */
export const Ghost: Story = {
  args: {
    isActive: false,
    variant: 'ghost',
    size: 18,
    label: 'QR Kód',
    display: 'icon-text',
    disabled: false,
  },
};

/** Aktív + Primary variáns */
export const ActivePrimary: Story = {
  args: {
    isActive: true,
    variant: 'primary',
    size: 18,
    label: 'QR Kód megtekintése',
    display: 'icon-text',
    disabled: false,
  },
};
