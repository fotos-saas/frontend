import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LucideAngularModule, Images } from 'lucide-angular';
import { WorkflowChangeListComponent } from './workflow-change-list.component';
import type { WorkflowChange } from '../../models/workflow.models';

const mockChanges: WorkflowChange[] = [
  {
    person_id: 1,
    person_name: 'Kiss Anna',
    before_url: 'https://placehold.co/120x160/e2e8f0/475569?text=R%C3%A9gi',
    after_url: 'https://placehold.co/120x160/d1fae5/065f46?text=%C3%9Aj',
    change_type: 'changed',
  },
  {
    person_id: 2,
    person_name: 'Nagy Péter',
    before_url: null,
    after_url: 'https://placehold.co/120x160/dbeafe/1d4ed8?text=%C3%9Aj',
    change_type: 'added',
  },
  {
    person_id: 3,
    person_name: 'Szabó Eszter',
    before_url: 'https://placehold.co/120x160/fee2e2/b91c1c?text=T%C3%B6r%C3%B6lt',
    after_url: null,
    change_type: 'removed',
  },
  {
    person_id: 4,
    person_name: 'Tóth Balázs',
    before_url: 'https://placehold.co/120x160/e2e8f0/475569?text=R%C3%A9gi',
    after_url: 'https://placehold.co/120x160/d1fae5/065f46?text=%C3%9Aj',
    change_type: 'changed',
  },
  {
    person_id: 5,
    person_name: 'Varga Lilla',
    before_url: null,
    after_url: 'https://placehold.co/120x160/dbeafe/1d4ed8?text=%C3%9Aj',
    change_type: 'added',
  },
];

const singleChange: WorkflowChange[] = [
  {
    person_id: 1,
    person_name: 'Kiss Anna',
    before_url: 'https://placehold.co/120x160/e2e8f0/475569?text=El%C5%91tte',
    after_url: 'https://placehold.co/120x160/d1fae5/065f46?text=Ut%C3%A1na',
    change_type: 'changed',
  },
];

const meta: Meta<WorkflowChangeListComponent> = {
  title: 'Partner/Workflow/ChangeList',
  component: WorkflowChangeListComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({ Images }),
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
type Story = StoryObj<WorkflowChangeListComponent>;

/** Default - Több változás (hozzáadás, módosítás, törlés) */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="max-width: 720px;">
        <app-workflow-change-list [changes]="changes" />
      </div>
    `,
    props: { changes: mockChanges },
  }),
};

/** Egyetlen módosítás */
export const SingleChange: Story = {
  render: () => ({
    template: `
      <div style="max-width: 720px;">
        <app-workflow-change-list [changes]="changes" />
      </div>
    `,
    props: { changes: singleChange },
  }),
};

/** Üres állapot - Nincs változás */
export const EmptyState: Story = {
  render: () => ({
    template: `
      <div style="max-width: 720px;">
        <app-workflow-change-list [changes]="changes" />
      </div>
    `,
    props: { changes: [] as WorkflowChange[] },
  }),
};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="max-width: 720px; padding: 24px; background: #1e293b; border-radius: 12px;">
        <app-workflow-change-list [changes]="changes" />
      </div>
    `,
    props: { changes: mockChanges },
  }),
};
