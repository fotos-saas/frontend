import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EditButtonComponent } from './edit-button.component';

const meta: Meta<EditButtonComponent> = {
  title: 'Shared/Actions/EditButton',
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
      description: 'Megjelenítés módja',
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

/** Ikon és szöveg */
export const WithLabel: Story = {
  args: {
    display: 'icon-text',
    label: 'Szerkesztés',
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    display: 'icon-only',
    label: 'Szerkesztés',
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    display: 'icon-only',
    label: 'Szerkesztés',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
