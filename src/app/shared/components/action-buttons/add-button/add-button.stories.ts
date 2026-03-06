import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { AddButtonComponent } from './add-button.component';

const meta: Meta<AddButtonComponent> = {
  title: 'Shared/Actions/AddButton',
  component: AddButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AddButtonComponent,
        LucideAngularModule.pick({ Plus }),
      ],
    }),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'compact', 'ghost'],
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
type Story = StoryObj<AddButtonComponent>;

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    variant: 'primary',
    label: 'Új',
    display: 'icon-text',
    size: 18,
    disabled: false,
  },
};

/** Kompakt variáns */
export const Compact: Story = {
  args: {
    variant: 'compact',
    label: 'Hozzáadás',
    display: 'icon-text',
    size: 16,
    disabled: false,
  },
};

/** Ghost variáns */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Új elem',
    display: 'icon-text',
    size: 18,
    disabled: false,
  },
};

/** Csak ikon */
export const IconOnly: Story = {
  args: {
    variant: 'primary',
    label: 'Új',
    display: 'icon-only',
    size: 18,
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    label: 'Új projekt',
    display: 'icon-text',
    size: 18,
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    variant: 'primary',
    label: 'Új',
    display: 'icon-text',
    size: 18,
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
