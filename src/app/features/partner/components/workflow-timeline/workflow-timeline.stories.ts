import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  LucideAngularModule,
  CheckCircle, XCircle, MinusCircle, Circle, Loader2,
} from 'lucide-angular';
import { WorkflowTimelineComponent } from './workflow-timeline.component';
import type { WorkflowStep } from '../../models/workflow.models';

const mockStepsCompleted: WorkflowStep[] = [
  {
    id: 1, step_key: 'check_changes', step_order: 1, status: 'completed',
    executor: 'backend', started_at: '2026-02-28T10:00:02', completed_at: '2026-02-28T10:00:05', error_message: null,
  },
  {
    id: 2, step_key: 'backup_psd', step_order: 2, status: 'completed',
    executor: 'electron', started_at: '2026-02-28T10:00:06', completed_at: '2026-02-28T10:00:18', error_message: null,
  },
  {
    id: 3, step_key: 'place_photos', step_order: 3, status: 'completed',
    executor: 'electron', started_at: '2026-02-28T10:00:19', completed_at: '2026-02-28T10:00:45', error_message: null,
  },
  {
    id: 4, step_key: 'generate_sample', step_order: 4, status: 'completed',
    executor: 'electron', started_at: '2026-02-28T10:00:46', completed_at: '2026-02-28T10:01:02', error_message: null,
  },
  {
    id: 5, step_key: 'build_summary', step_order: 5, status: 'completed',
    executor: 'backend', started_at: '2026-02-28T10:01:03', completed_at: '2026-02-28T10:01:04', error_message: null,
  },
  {
    id: 6, step_key: 'draft_email', step_order: 6, status: 'completed',
    executor: 'backend', started_at: '2026-02-28T10:01:05', completed_at: '2026-02-28T10:01:06', error_message: null,
  },
  {
    id: 7, step_key: 'move_to_approval', step_order: 7, status: 'completed',
    executor: 'backend', started_at: '2026-02-28T10:01:07', completed_at: '2026-02-28T10:01:08', error_message: null,
  },
];

const mockStepsRunning: WorkflowStep[] = [
  {
    id: 1, step_key: 'check_changes', step_order: 1, status: 'completed',
    executor: 'backend', started_at: '2026-02-28T10:00:02', completed_at: '2026-02-28T10:00:05', error_message: null,
  },
  {
    id: 2, step_key: 'backup_psd', step_order: 2, status: 'completed',
    executor: 'electron', started_at: '2026-02-28T10:00:06', completed_at: '2026-02-28T10:00:18', error_message: null,
  },
  {
    id: 3, step_key: 'place_photos', step_order: 3, status: 'running',
    executor: 'electron', started_at: '2026-02-28T10:00:19', completed_at: null, error_message: null,
  },
  {
    id: 4, step_key: 'generate_sample', step_order: 4, status: 'pending',
    executor: 'electron', started_at: null, completed_at: null, error_message: null,
  },
  {
    id: 5, step_key: 'build_summary', step_order: 5, status: 'pending',
    executor: 'backend', started_at: null, completed_at: null, error_message: null,
  },
  {
    id: 6, step_key: 'draft_email', step_order: 6, status: 'pending',
    executor: 'backend', started_at: null, completed_at: null, error_message: null,
  },
  {
    id: 7, step_key: 'move_to_approval', step_order: 7, status: 'pending',
    executor: 'backend', started_at: null, completed_at: null, error_message: null,
  },
];

const mockStepsFailed: WorkflowStep[] = [
  {
    id: 1, step_key: 'check_changes', step_order: 1, status: 'completed',
    executor: 'backend', started_at: '2026-02-28T10:00:02', completed_at: '2026-02-28T10:00:05', error_message: null,
  },
  {
    id: 2, step_key: 'backup_psd', step_order: 2, status: 'failed',
    executor: 'electron', started_at: '2026-02-28T10:00:06', completed_at: null,
    error_message: 'Photoshop nem elérhető. Indítsd el az alkalmazást!',
  },
  {
    id: 3, step_key: 'place_photos', step_order: 3, status: 'skipped',
    executor: 'electron', started_at: null, completed_at: null, error_message: null,
  },
  {
    id: 4, step_key: 'generate_sample', step_order: 4, status: 'skipped',
    executor: 'electron', started_at: null, completed_at: null, error_message: null,
  },
  {
    id: 5, step_key: 'build_summary', step_order: 5, status: 'skipped',
    executor: 'backend', started_at: null, completed_at: null, error_message: null,
  },
];

const meta: Meta<WorkflowTimelineComponent> = {
  title: 'Partner/Workflow/Timeline',
  component: WorkflowTimelineComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({ CheckCircle, XCircle, MinusCircle, Circle, Loader2 }),
      ],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj<WorkflowTimelineComponent>;

/** Default - Minden lépés befejezve */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="max-width: 480px;">
        <app-workflow-timeline [steps]="steps" />
      </div>
    `,
    props: { steps: mockStepsCompleted },
  }),
};

/** Futó munkafolyamat - Közepén tart */
export const Running: Story = {
  render: () => ({
    template: `
      <div style="max-width: 480px;">
        <app-workflow-timeline [steps]="steps" />
      </div>
    `,
    props: { steps: mockStepsRunning },
  }),
};

/** Hibás lépés - Hiba + kihagyott lépések */
export const Failed: Story = {
  render: () => ({
    template: `
      <div style="max-width: 480px;">
        <app-workflow-timeline [steps]="steps" />
      </div>
    `,
    props: { steps: mockStepsFailed },
  }),
};

/** Üres állapot - Nincs lépés */
export const EmptyState: Story = {
  render: () => ({
    template: `
      <div style="max-width: 480px;">
        <app-workflow-timeline [steps]="steps" />
        <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 12px;">
          Nincs megjeleníthető lépés.
        </p>
      </div>
    `,
    props: { steps: [] as WorkflowStep[] },
  }),
};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="max-width: 480px; padding: 24px; background: #1e293b; border-radius: 12px;">
        <app-workflow-timeline [steps]="steps" />
      </div>
    `,
    props: { steps: mockStepsRunning },
  }),
};
