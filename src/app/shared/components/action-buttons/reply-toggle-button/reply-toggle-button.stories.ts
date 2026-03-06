import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ReplyToggleButtonComponent } from './reply-toggle-button.component';

const meta: Meta<ReplyToggleButtonComponent> = {
  title: 'Shared/Actions/ReplyToggleButton',
  component: ReplyToggleButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReplyToggleButtonComponent],
    }),
  ],
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 100 },
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

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    count: 3,
    expanded: false,
  },
};

/** Kinyitott állapot */
export const Expanded: Story = {
  args: {
    count: 3,
    expanded: true,
  },
};

/** Sok válasz */
export const ManyReplies: Story = {
  args: {
    count: 42,
    expanded: false,
  },
};

/** Egyetlen válasz */
export const SingleReply: Story = {
  args: {
    count: 1,
    expanded: false,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    count: 5,
    expanded: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
