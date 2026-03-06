import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ProjectDetailTabsComponent } from './project-detail-tabs.component';
import { LucideAngularModule } from 'lucide-angular';

const meta: Meta<ProjectDetailTabsComponent> = {
  title: 'Shared/Layout/ProjectDetailTabs',
  component: ProjectDetailTabsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ProjectDetailTabsComponent, LucideAngularModule],
    }),
  ],
  argTypes: {
    activeTab: {
      control: 'select',
      options: ['overview', 'emails', 'users', 'samples', 'tasks', 'settings', 'print', 'activity'],
      description: 'Aktív tab',
    },
    hiddenTabs: { control: 'object', description: 'Elrejtett tabok' },
    badges: { control: 'object', description: 'Tab badge-ek' },
  },
};

export default meta;
type Story = StoryObj<ProjectDetailTabsComponent>;

/** Alapértelmezett - Áttekintés aktív */
export const Default: Story = {
  args: {
    activeTab: 'overview',
    hiddenTabs: [],
    badges: {},
  },
};

/** Feladatok tab aktív - badge-dzsel */
export const FeladatokBadge: Story = {
  args: {
    activeTab: 'tasks',
    hiddenTabs: [],
    badges: { tasks: 5 },
  },
};

/** E-mailek aktív */
export const EmailekAktiv: Story = {
  args: {
    activeTab: 'emails',
    hiddenTabs: [],
    badges: {},
  },
};

/** Rejtett tabok (marketer nézet) */
export const RejtettTabok: Story = {
  args: {
    activeTab: 'overview',
    hiddenTabs: ['settings', 'print'],
    badges: { tasks: 2 },
  },
};

/** Több badge */
export const TobbBadge: Story = {
  args: {
    activeTab: 'overview',
    hiddenTabs: [],
    badges: { tasks: 3, emails: 12 },
  },
};
