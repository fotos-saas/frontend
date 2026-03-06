import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ProjectDetailHeaderComponent } from './project-detail-header.component';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';

const MOCK_PROJECT = {
  id: 42,
  name: 'Kossuth Lajos Gimnázium - 12.A',
  school: { id: 1, name: 'Kossuth Lajos Gimnázium', city: 'Budapest' },
  partner: { id: 1, name: 'FotóStúdió Kft.' },
  className: '12.A',
  classYear: '2025/2026',
  status: 'waiting_for_response',
  statusLabel: 'Válaszra vár',
  statusColor: '#f59e0b',
  tabloStatus: null,
  photoDate: '2026-03-15',
  deadline: '2026-04-01',
  expectedClassSize: 32,
  contact: null,
  contacts: [],
  qrCode: null,
  activeQrCodes: [],
  qrCodesHistory: [],
};

const meta: Meta<ProjectDetailHeaderComponent> = {
  title: 'Shared/Layout/ProjectDetailHeader',
  component: ProjectDetailHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ProjectDetailHeaderComponent, LucideAngularModule, MatTooltipModule],
    }),
  ],
  argTypes: {
    loading: { control: 'boolean', description: 'Betöltés állapot' },
    isMarketer: { control: 'boolean', description: 'Marketer nézet' },
    showTabloEditor: { control: 'boolean', description: 'Tabló editor gomb' },
  },
};

export default meta;
type Story = StoryObj<ProjectDetailHeaderComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    project: MOCK_PROJECT as any,
    loading: false,
    isMarketer: false,
    showTabloEditor: false,
  },
};

/** Betöltés állapot */
export const Betoltes: Story = {
  args: {
    project: null,
    loading: true,
    isMarketer: false,
    showTabloEditor: false,
  },
};

/** Marketer nézet */
export const MarketerNezet: Story = {
  args: {
    project: MOCK_PROJECT as any,
    loading: false,
    isMarketer: true,
    showTabloEditor: false,
  },
};

/** Tabló editor gombbal */
export const TabloEditorGombbal: Story = {
  args: {
    project: MOCK_PROJECT as any,
    loading: false,
    isMarketer: false,
    showTabloEditor: true,
  },
};

/** Kész státuszú projekt */
export const KeszProjekt: Story = {
  args: {
    project: {
      ...MOCK_PROJECT,
      status: 'done',
      statusLabel: 'Kész',
      statusColor: '#22c55e',
    } as any,
    loading: false,
    isMarketer: false,
    showTabloEditor: false,
  },
};
