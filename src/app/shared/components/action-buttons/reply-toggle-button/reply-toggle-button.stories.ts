import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReplyToggleButtonComponent } from './reply-toggle-button.component';

const meta: Meta<ReplyToggleButtonComponent> = {
  title: 'Shared/ActionButtons/ReplyToggleButton',
  component: ReplyToggleButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReplyToggleButtonComponent],
    }),
  ],
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 999 },
      description: 'Válaszok száma',
    },
    expanded: {
      control: 'boolean',
      description: 'Kinyitott állapot',
    },
  },
};

export default meta;
type Story = StoryObj<ReplyToggleButtonComponent>;

/** Alapértelmezett megjelenés (összecsukott, 3 válasz) */
export const Default: Story = {
  args: {
    count: 3,
    expanded: false,
  },
};

/** Letiltott állapot - nincs disabled input, de 0 válasz is megjeleníthető */
export const Disabled: Story = {
  args: {
    count: 0,
    expanded: false,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    count: 3,
    expanded: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-reply-toggle-button [count]="count" [expanded]="expanded" />'}</div>`,
      props: story().props,
    }),
  ],
};

/** Kinyitott állapot (aktív) */
export const Expanded: Story = {
  args: {
    count: 5,
    expanded: true,
  },
};

/** Egy válasz */
export const SingleReply: Story = {
  args: {
    count: 1,
    expanded: false,
  },
};

/** Sok válasz */
export const ManyReplies: Story = {
  args: {
    count: 42,
    expanded: false,
  },
};
