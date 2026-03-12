import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ExpandButtonComponent } from './expand-button.component';

const meta: Meta<ExpandButtonComponent> = {
  title: 'Shared/ActionButtons/ExpandButton',
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
      description: 'Megjelenítési mód',
    },
    expanded: {
      control: 'boolean',
      description: 'Kinyitott állapot',
    },
    expandLabel: {
      control: 'text',
      description: 'Kinyitás szöveg',
    },
    collapseLabel: {
      control: 'text',
      description: 'Összecsukás szöveg',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<ExpandButtonComponent>;

/** Alapértelmezett (összecsukott) állapot */
export const Default: Story = {
  args: {
    display: 'icon-text',
    expanded: false,
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
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
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-expand-button [display]="display" [expanded]="expanded" [expandLabel]="expandLabel" [collapseLabel]="collapseLabel" [disabled]="disabled" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Kinyitott állapot (ikon forgatva, "Kevesebb" szöveg) */
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
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
    disabled: false,
  },
};

/** Egyedi szövegekkel */
export const CustomLabels: Story = {
  args: {
    display: 'icon-text',
    expanded: false,
    expandLabel: 'Részletek mutatása',
    collapseLabel: 'Részletek elrejtése',
    disabled: false,
  },
};
