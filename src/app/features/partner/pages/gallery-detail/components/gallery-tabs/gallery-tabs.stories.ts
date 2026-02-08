import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { LucideAngularModule, Image, Activity } from 'lucide-angular';
import { GalleryTabsComponent, GalleryTab } from './gallery-tabs.component';

const meta: Meta<GalleryTabsComponent> = {
  title: 'Partner/GalleryTabs',
  component: GalleryTabsComponent,
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ Image, Activity })],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj<GalleryTabsComponent>;

/** Default - Galéria kezelés tab aktív */
export const Default: Story = {
  render: () => ({
    props: {
      activeTab: signal<GalleryTab>('gallery'),
      onTabChange(tab: GalleryTab) {
        this.activeTab.set(tab);
      },
    },
    template: `
      <app-gallery-tabs
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)"
      />
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 0.875rem;">
        <strong>Aktív tab:</strong> {{ activeTab() }}
      </div>
    `,
  }),
};

/** MonitoringActive - Nyomon követés tab aktív */
export const MonitoringActive: Story = {
  render: () => ({
    props: {
      activeTab: signal<GalleryTab>('monitoring'),
      onTabChange(tab: GalleryTab) {
        this.activeTab.set(tab);
      },
    },
    template: `
      <app-gallery-tabs
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)"
      />
    `,
  }),
};

/** DarkMode - Sötét háttéren */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    props: {
      activeTab: signal<GalleryTab>('gallery'),
      onTabChange(tab: GalleryTab) {
        this.activeTab.set(tab);
      },
    },
    template: `
      <div style="padding: 20px; background: #1e293b; border-radius: 12px;">
        <app-gallery-tabs
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />
      </div>
    `,
  }),
};
