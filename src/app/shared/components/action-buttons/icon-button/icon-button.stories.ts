import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  LucideAngularModule,
  Trash2,
  Pencil,
  Settings,
  Plus,
  MessageCircle,
  Reply,
  Check,
  Download,
  Copy,
  Search,
  RefreshCw,
} from 'lucide-angular';
import { IconButtonComponent } from './icon-button.component';

const meta: Meta<IconButtonComponent> = {
  title: 'Shared/ActionButtons/IconButton',
  component: IconButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        IconButtonComponent,
        LucideAngularModule.pick({
          Trash2,
          Pencil,
          Settings,
          Plus,
          MessageCircle,
          Reply,
          Check,
          Download,
          Copy,
          Search,
          RefreshCw,
        }),
      ],
    }),
  ],
  argTypes: {
    icon: {
      control: 'select',
      options: [
        'trash-2', 'pencil', 'settings', 'plus', 'message-circle',
        'reply', 'check', 'download', 'copy', 'search', 'refresh-cw',
      ],
      description: 'Lucide ikon neve',
    },
    label: {
      control: 'text',
      description: 'Gomb felirata',
    },
    display: {
      control: 'select',
      options: ['icon-text', 'icon-only', 'text-only'],
      description: 'Megjelenítési mód',
    },
    variant: {
      control: 'select',
      options: ['default', 'danger', 'primary', 'success'],
      description: 'Szín variáns',
    },
    size: {
      control: { type: 'number', min: 10, max: 32 },
      description: 'Ikon mérete pixelben',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<IconButtonComponent>;

/** Alapértelmezett megjelenés (szerkesztés ikon) */
export const Default: Story = {
  args: {
    icon: 'pencil',
    label: 'Szerkesztés',
    display: 'icon-only',
    variant: 'default',
    size: 14,
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-icon-button [icon]="icon" [label]="label" [display]="display" [variant]="variant" [size]="size" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Törlés gomb (danger variáns) */
export const Delete: Story = {
  args: {
    icon: 'trash-2',
    label: 'Törlés',
    display: 'icon-text',
    variant: 'danger',
    size: 14,
    disabled: false,
  },
};

/** Válasz gomb (primary variáns) */
export const Reply: Story = {
  args: {
    icon: 'reply',
    label: 'Válasz',
    display: 'icon-text',
    variant: 'primary',
    size: 14,
    disabled: false,
  },
};

/** Mentés gomb (success variáns) */
export const Save: Story = {
  args: {
    icon: 'check',
    label: 'Mentés',
    display: 'icon-text',
    variant: 'success',
    size: 14,
    disabled: false,
  },
};

/** Beállítások ikon */
export const Settings: Story = {
  args: {
    icon: 'settings',
    label: 'Beállítások',
    display: 'icon-only',
    variant: 'default',
    size: 16,
    disabled: false,
  },
};

/** Hozzáadás gomb (primary, ikon + szöveg) */
export const Add: Story = {
  args: {
    icon: 'plus',
    label: 'Hozzáadás',
    display: 'icon-text',
    variant: 'primary',
    size: 14,
    disabled: false,
  },
};

/** Komment gomb */
export const Comment: Story = {
  args: {
    icon: 'message-circle',
    label: 'Hozzászólás',
    display: 'icon-text',
    variant: 'default',
    size: 14,
    disabled: false,
  },
};

/** Letöltés gomb */
export const Download: Story = {
  args: {
    icon: 'download',
    label: 'Letöltés',
    display: 'icon-text',
    variant: 'default',
    size: 14,
    disabled: false,
  },
};

/** Másolás gomb */
export const Copy: Story = {
  args: {
    icon: 'copy',
    label: 'Másolás',
    display: 'icon-text',
    variant: 'default',
    size: 14,
    disabled: false,
  },
};

/** Keresés gomb */
export const Search: Story = {
  args: {
    icon: 'search',
    label: 'Keresés',
    display: 'icon-only',
    variant: 'default',
    size: 16,
    disabled: false,
  },
};

/** Frissítés gomb */
export const Refresh: Story = {
  args: {
    icon: 'refresh-cw',
    label: 'Frissítés',
    display: 'icon-text',
    variant: 'default',
    size: 14,
    disabled: false,
  },
};
