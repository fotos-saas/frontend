import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { WorkflowStatusBadgeComponent } from './workflow-status-badge.component';
import type { WorkflowStatus } from '../../models/workflow.models';

const allStatuses: WorkflowStatus[] = [
  'pending', 'running', 'awaiting_approval', 'approved',
  'rejected', 'completed', 'failed', 'cancelled',
];

const meta: Meta<WorkflowStatusBadgeComponent> = {
  title: 'Partner/Workflow/StatusBadge',
  component: WorkflowStatusBadgeComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
  argTypes: {
    status: {
      control: 'select',
      options: allStatuses,
      description: 'A munkafolyamat aktuális státusza',
    },
  },
};

export default meta;
type Story = StoryObj<WorkflowStatusBadgeComponent>;

/** Default - Jóváhagyásra vár */
export const Default: Story = {
  args: { status: 'awaiting_approval' as WorkflowStatus },
};

/** Összes státusz egy rácsban */
export const AllStatuses: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; align-items: center; margin: -6px;">
        @for (s of statuses; track s) {
          <div style="margin: 6px;">
            <app-workflow-status-badge [status]="s" />
          </div>
        }
      </div>
    `,
    props: {
      statuses: allStatuses,
    },
  }),
};

/** Üres / ismeretlen státusz (fallback) */
export const UnknownStatus: Story = {
  render: () => ({
    template: `
      <app-workflow-status-badge [status]="'unknown_state'" />
    `,
  }),
};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 24px; background: #1e293b; border-radius: 12px; display: flex; flex-wrap: wrap; margin: -6px;">
        @for (s of statuses; track s) {
          <div style="margin: 6px;">
            <app-workflow-status-badge [status]="s" />
          </div>
        }
      </div>
    `,
    props: {
      statuses: allStatuses,
    },
  }),
};
