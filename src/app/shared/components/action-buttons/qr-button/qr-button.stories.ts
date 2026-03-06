import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, QrCode } from 'lucide-angular';
import { QrButtonComponent } from './qr-button.component';

const meta: Meta<QrButtonComponent> = {
  title: 'Shared/Actions/QrButton',
  component: QrButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        QrButtonComponent,
        LucideAngularModule.pick({ QrCode }),
      ],
    }),
  ],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Aktív QR kód van-e',
    },
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'icon-only'],
      description: 'Gomb variáns',
    },
    size: {
      control: { type: 'number', min: 12, max: 32 },
      description: 'Ikon méret (px)',
    },
    label: {
      control: 'text',
      description: 'Gomb szöveg',
    },
    display: {
      control: 'select',
      options: ['icon-text', 'icon-only', 'text-only'],
      description: 'Megjelenítés módja',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<QrButtonComponent>;

/** Alapértelmezett megjelenés (csak ikon) */
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

/** Aktív QR kód */
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

/** Primary variáns */
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

/** Ghost variáns */
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

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    isActive: false,
    variant: 'primary',
    size: 18,
    label: 'QR Kód',
    display: 'icon-text',
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    isActive: false,
    variant: 'icon-only',
    size: 18,
    label: 'QR Kód',
    display: 'icon-text',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
