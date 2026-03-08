import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TabBarComponent } from './tab-bar.component';
import { TabManagerService } from '../../services/tab-manager.service';
import type { Tab } from '../../models/tab.model';

// Mock tab adatok
const mockTabs: Tab[] = [
  {
    id: '1', title: 'Vezerlopult', url: '/partner/dashboard',
    icon: 'layout-dashboard', createdAt: Date.now(), lastActiveAt: Date.now(),
    isDirty: false, isPinned: false, scrollPosition: { x: 0, y: 0 },
  },
  {
    id: '2', title: '3.A osztaly - Kosa', url: '/partner/projects/42',
    icon: 'folder', createdAt: Date.now(), lastActiveAt: Date.now(),
    isDirty: true, isPinned: false, scrollPosition: { x: 0, y: 0 },
  },
  {
    id: '3', title: 'Beallitasok', url: '/partner/settings',
    icon: 'settings', createdAt: Date.now(), lastActiveAt: Date.now(),
    isDirty: false, isPinned: true, scrollPosition: { x: 0, y: 0 },
  },
];

const meta: Meta<TabBarComponent> = {
  title: 'Core/Tab System/TabBar',
  component: TabBarComponent,
  decorators: [
    moduleMetadata({
      imports: [DragDropModule, LucideAngularModule, MatTooltipModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<TabBarComponent>;

export const Default: Story = {};

export const ManyTabs: Story = {
  parameters: {
    docs: {
      description: { story: 'Tab bar sok nyitott tabbal' },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      ...story(),
      template: `<div class="dark">${story().template || '<app-tab-bar />'}</div>`,
    }),
  ],
};
