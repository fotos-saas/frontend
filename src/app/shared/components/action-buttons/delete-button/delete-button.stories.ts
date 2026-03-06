import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { DeleteButtonComponent } from './delete-button.component';

const meta: Meta<DeleteButtonComponent> = {
  title: 'Shared/Actions/DeleteButton',
  component: DeleteButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [DeleteButtonComponent],
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
type Story = StoryObj<DeleteButtonComponent>;

/** Alapértelmezett megjelenés (csak ikon) */
export const Default: Story = {
  args: {
    display: 'icon-only',
    label: 'Törlés',
    disabled: false,
  },
};

/** Ikon és szöveg */
export const WithLabel: Story = {
  args: {
    display: 'icon-text',
    label: 'Törlés',
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    display: 'icon-only',
    label: 'Törlés',
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    display: 'icon-only',
    label: 'Törlés',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
