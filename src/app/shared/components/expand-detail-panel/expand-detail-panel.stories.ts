import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ExpandDetailPanelComponent } from './expand-detail-panel.component';
import { LucideAngularModule } from 'lucide-angular';
import { importProvidersFrom } from '@angular/core';

const meta: Meta<ExpandDetailPanelComponent> = {
  title: 'Shared/Layout/ExpandDetailPanel',
  component: ExpandDetailPanelComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ExpandDetailPanelComponent, LucideAngularModule],
    }),
  ],
  argTypes: {
    loading: { control: 'boolean', description: 'Betöltési állapot' },
    empty: { control: 'boolean', description: 'Üres állapot' },
    emptyText: { control: 'text', description: 'Üres állapot szövege' },
    skeletonRows: { control: { type: 'number', min: 1, max: 10 }, description: 'Skeleton sorok száma' },
  },
};

export default meta;
type Story = StoryObj<ExpandDetailPanelComponent>;

/** Alapértelmezett - tartalommal */
export const Default: Story = {
  args: {
    loading: false,
    empty: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-expand-detail-panel [loading]="loading" [empty]="empty">
        <p style="padding: 16px; margin: 0;">Példa tartalom a panelben</p>
      </app-expand-detail-panel>
    `,
  }),
};

/** Betöltés állapot - skeleton shimmer */
export const Loading: Story = {
  args: {
    loading: true,
    empty: false,
    skeletonRows: 3,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-expand-detail-panel [loading]="loading" [skeletonRows]="skeletonRows">
        <p>Ez nem látszik betöltéskor</p>
      </app-expand-detail-panel>
    `,
  }),
};

/** Üres állapot */
export const Empty: Story = {
  args: {
    loading: false,
    empty: true,
    emptyText: 'Nincs megjeleníthető adat',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-expand-detail-panel [loading]="loading" [empty]="empty" [emptyText]="emptyText">
        <p>Ez nem látszik üres állapotban</p>
      </app-expand-detail-panel>
    `,
  }),
};

/** Egyedi üres szöveggel */
export const EgyediUresSzoveg: Story = {
  args: {
    loading: false,
    empty: true,
    emptyText: 'Még nem töltöttek fel képeket',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-expand-detail-panel [loading]="loading" [empty]="empty" [emptyText]="emptyText" />
    `,
  }),
};
