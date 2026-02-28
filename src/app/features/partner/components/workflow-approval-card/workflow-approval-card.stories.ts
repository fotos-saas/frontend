import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Check, X, CheckCircle, XCircle, FileText, Image, Mail, Monitor,
} from 'lucide-angular';
import { WorkflowApprovalCardComponent } from './workflow-approval-card.component';
import type { WorkflowDetail } from '../../models/workflow.models';

/** Jóváhagyásra váró munkafolyamat teljes adatokkal */
const mockAwaitingApproval: WorkflowDetail = {
  id: 42,
  project_id: 1,
  project_name: 'Hunyadi János Ált. Isk. — 12.A',
  type: 'photo_swap',
  status: 'awaiting_approval',
  trigger_type: 'event',
  triggered_by: 'Rendszer',
  approval_location: 'both',
  started_at: '2026-02-28T10:00:00',
  completed_at: null,
  created_at: '2026-02-28T09:59:55',
  input_data: {},
  output_data: {},
  approval_data: {
    summary: '3 diák fotója módosult: Kiss Anna (csere), Nagy Péter (új), Szabó Eszter (törölt).',
    changes: [
      { person_id: 1, person_name: 'Kiss Anna', before_url: null, after_url: null, change_type: 'changed' },
      { person_id: 2, person_name: 'Nagy Péter', before_url: null, after_url: null, change_type: 'added' },
      { person_id: 3, person_name: 'Szabó Eszter', before_url: null, after_url: null, change_type: 'removed' },
    ],
    email_draft: {
      subject: 'Tablófotó minta — Hunyadi 12.A',
      body: 'Kedves Szülők!\n\nElkészült a tablóminta az alábbi módosításokkal. Kérjük, nézzék meg és jelezzék, ha elfogadják.\n\nÜdvözlettel,\nFotóStúdió',
      recipients: ['szulok-12a@iskola.hu', 'osztalyfonok@iskola.hu'],
    },
    sample_url: 'https://placehold.co/600x400/f0f4ff/475569?text=Tabl%C3%B3+minta',
  },
  approved_by: null,
  approved_at: null,
  rejected_by: null,
  rejected_at: null,
  rejected_reason: null,
  error_message: null,
  steps: [],
};

/** Jóváhagyásra váró, összefoglaló nélkül */
const mockAwaitingMinimal: WorkflowDetail = {
  ...mockAwaitingApproval,
  id: 43,
  approval_data: {
    summary: '',
    changes: [],
  },
};

/** Már jóváhagyott munkafolyamat */
const mockApproved: WorkflowDetail = {
  ...mockAwaitingApproval,
  id: 44,
  status: 'approved',
  approval_data: null,
  approved_by: { id: 1, name: 'Kovács János' },
  approved_at: '2026-02-28T10:15:00',
};

/** Elutasított munkafolyamat */
const mockRejected: WorkflowDetail = {
  ...mockAwaitingApproval,
  id: 45,
  status: 'rejected',
  approval_data: null,
  rejected_by: { id: 1, name: 'Kovács János' },
  rejected_at: '2026-02-28T10:20:00',
  rejected_reason: 'A 3. sorban lévő fotó rossz felbontású, kérjük cseréljék ki.',
};

/** Desktop-only jóváhagyás */
const mockDesktopOnly: WorkflowDetail = {
  ...mockAwaitingApproval,
  id: 46,
  approval_location: 'desktop',
};

const meta: Meta<WorkflowApprovalCardComponent> = {
  title: 'Partner/Workflow/ApprovalCard',
  component: WorkflowApprovalCardComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        FormsModule,
        LucideAngularModule.pick({ Check, X, CheckCircle, XCircle, FileText, Image, Mail, Monitor }),
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
type Story = StoryObj<WorkflowApprovalCardComponent>;

/** Default - Jóváhagyásra vár (teljes adatok: összefoglaló, minta, email vázlat) */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="true" />
      </div>
    `,
    props: { workflow: mockAwaitingApproval },
  }),
};

/** Minimális - Nincs összefoglaló, minta, email vázlat */
export const Minimal: Story = {
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="true" />
      </div>
    `,
    props: { workflow: mockAwaitingMinimal },
  }),
};

/** Csak asztali alkalmazásban hagyható jóvá */
export const DesktopOnly: Story = {
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="false" />
      </div>
    `,
    props: { workflow: mockDesktopOnly },
  }),
};

/** Már jóváhagyott eredmény */
export const Approved: Story = {
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="true" />
      </div>
    `,
    props: { workflow: mockApproved },
  }),
};

/** Elutasított eredmény (indoklással) */
export const Rejected: Story = {
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="true" />
      </div>
    `,
    props: { workflow: mockRejected },
  }),
};

/** Üres állapot - Nem várakozó státusz, nem jóváhagyott/elutasított */
export const EmptyState: Story = {
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="true" />
      </div>
    `,
    props: {
      workflow: { ...mockAwaitingApproval, status: 'running', approval_data: null } as WorkflowDetail,
    },
  }),
};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="max-width: 640px; padding: 24px; background: #1e293b; border-radius: 12px;">
        <app-workflow-approval-card [workflow]="workflow" [canApproveHere]="true" />
      </div>
    `,
    props: { workflow: mockAwaitingApproval },
  }),
};
