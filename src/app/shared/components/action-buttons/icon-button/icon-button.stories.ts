import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, Trash2, Pencil, Reply, Plus, MessageCircle, Check } from 'lucide-angular';
import { IconButtonComponent } from './icon-button.component';

const meta: Meta<IconButtonComponent> = {
  title: 'Shared/Actions/IconButton',
  component: IconButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        IconButtonComponent,
        LucideAngularModule.pick({ Trash2, Pencil, Reply, Plus, MessageCircle, Check }),
      ],
    }),
  ],
  argTypes: {
    icon: {
      control: 'text',
      description: 'Lucide ikon neve',
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
    variant: {
      control: 'select',
      options: ['default', 'danger', 'primary', 'success'],
      description: 'Szín variáns',
    },
    size: {
      control: { type: 'number', min: 10, max: 28 },
      description: 'Ikon méret (px)',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<IconButtonComponent>;

/** Alapértelmezett megjelenés */
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

/** Danger variáns - törlés */
export const Danger: Story = {
  args: {
    icon: 'trash-2',
    label: 'Törlés',
    display: 'icon-text',
    variant: 'danger',
    size: 14,
    disabled: false,
  },
};

/** Primary variáns - válasz */
export const Primary: Story = {
  args: {
    icon: 'reply',
    label: 'Válasz',
    display: 'icon-text',
    variant: 'primary',
    size: 14,
    disabled: false,
  },
};

/** Success variáns - mentés */
export const Success: Story = {
  args: {
    icon: 'check',
    label: 'Mentés',
    display: 'icon-text',
    variant: 'success',
    size: 14,
    disabled: false,
  },
};

/** Ikon és szöveg együtt */
export const WithLabel: Story = {
  args: {
    icon: 'plus',
    label: 'Hozzáadás',
    display: 'icon-text',
    variant: 'primary',
    size: 14,
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    icon: 'pencil',
    label: 'Szerkesztés',
    display: 'icon-text',
    variant: 'default',
    size: 14,
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    icon: 'pencil',
    label: 'Szerkesztés',
    display: 'icon-text',
    variant: 'default',
    size: 14,
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
