import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LoadMoreButtonComponent } from './load-more-button.component';

const meta: Meta<LoadMoreButtonComponent> = {
  title: 'Shared/LoadMoreButton',
  component: LoadMoreButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [LoadMoreButtonComponent],
    }),
  ],
  argTypes: {
    loadedCount: {
      control: { type: 'number', min: 0, max: 1000 },
      description: 'Betöltött képek száma',
    },
    totalCount: {
      control: { type: 'number', min: 0, max: 1000 },
      description: 'Összes kép száma',
    },
    isLoading: {
      control: 'boolean',
      description: 'Betöltés folyamatban',
    },
  },
};

export default meta;
type Story = StoryObj<LoadMoreButtonComponent>;

/**
 * Default - alapértelmezett megjelenés
 */
export const Default: Story = {
  args: {
    loadedCount: 100,
    totalCount: 350,
    isLoading: false,
  },
};

/**
 * Loading - betöltés folyamatban
 */
export const Loading: Story = {
  args: {
    loadedCount: 100,
    totalCount: 350,
    isLoading: true,
  },
};

/**
 * SmallRemaining - kevés hátralevő kép
 */
export const SmallRemaining: Story = {
  args: {
    loadedCount: 340,
    totalCount: 350,
    isLoading: false,
  },
};

/**
 * AllLoaded - minden betöltve (gomb nem jelenik meg)
 */
export const AllLoaded: Story = {
  args: {
    loadedCount: 350,
    totalCount: 350,
    isLoading: false,
  },
};

/**
 * LargeDataset - nagy adatkészlet
 */
export const LargeDataset: Story = {
  args: {
    loadedCount: 100,
    totalCount: 2500,
    isLoading: false,
  },
};

/**
 * DarkMode - sötét mód
 */
export const DarkMode: Story = {
  args: {
    loadedCount: 100,
    totalCount: 350,
    isLoading: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story: () => { template?: string; props?: Record<string, unknown> }) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b;">${story().template || '<app-load-more-button [loadedCount]="loadedCount" [totalCount]="totalCount" [isLoading]="isLoading" />'}</div>`,
      props: story().props,
    }),
  ],
};
