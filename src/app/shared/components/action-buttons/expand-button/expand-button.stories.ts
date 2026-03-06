import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ExpandButtonComponent } from './expand-button.component';

const meta: Meta<ExpandButtonComponent> = {
  title: 'Shared/Actions/ExpandButton',
  component: ExpandButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ExpandButtonComponent],
    }),
  ],
  argTypes: {
    display: {
      control: 'select',
      options: ['icon-text', 'icon-only', 'text-only'],
      description: 'Megjelenítés módja',
    },
    expanded: {
      control: 'boolean',
      description: 'Kinyitott állapot',
    },
    expandLabel: {
      control: 'text',
      description: 'Szöveg összecsukott állapotban',
    },
    collapseLabel: {
      control: 'text',
      description: 'Szöveg kinyitott állapotban',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<ExpandButtonComponent>;

/** Alapértelmezett (összecsukott) */
export const Default: Story = {
  args: {
    display: 'icon-text',
    expanded: false,
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
    disabled: false,
  },
};

/** Kinyitott állapot */
export const Expanded: Story = {
  args: {
    display: 'icon-text',
    expanded: true,
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
    disabled: false,
  },
};

/** Csak ikon */
export const IconOnly: Story = {
  args: {
    display: 'icon-only',
    expanded: false,
    disabled: false,
  },
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    display: 'icon-text',
    expanded: false,
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
    disabled: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    display: 'icon-text',
    expanded: false,
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
