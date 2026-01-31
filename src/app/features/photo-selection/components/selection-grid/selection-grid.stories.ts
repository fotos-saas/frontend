import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SelectionGridComponent } from './selection-grid.component';
import { LoadMoreButtonComponent } from '../../../../shared/components/load-more-button';
import { WorkflowPhoto } from '../../models/workflow.models';

// Mock photo generator
function generateMockPhotos(count: number, startId = 1): WorkflowPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    url: `https://picsum.photos/seed/${startId + i}/800/800`,
    thumbnailUrl: `https://picsum.photos/seed/${startId + i}/300/300`,
    filename: `photo_${startId + i}.jpg`,
  }));
}

const meta: Meta<SelectionGridComponent> = {
  title: 'PhotoSelection/SelectionGrid',
  component: SelectionGridComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ScrollingModule, LoadMoreButtonComponent],
    }),
  ],
  argTypes: {
    useVirtualScroll: {
      control: 'boolean',
      description: 'Virtual scroll használata (feature flag)',
    },
    pageSize: {
      control: { type: 'number', min: 10, max: 500 },
      description: 'Page méret pagination módban',
    },
    allowMultiple: {
      control: 'boolean',
      description: 'Több fotó kiválasztható-e',
    },
    maxSelection: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Maximum kiválasztható fotók száma',
    },
    readonly: {
      control: 'boolean',
      description: 'Readonly mód',
    },
  },
};

export default meta;
type Story = StoryObj<SelectionGridComponent>;

const mockPhotos = generateMockPhotos(50);
const largeMockPhotos = generateMockPhotos(350);

/**
 * Default - Virtual Scroll mód
 */
export const Default: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [1, 5, 10],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * Pagination - "Több kép betöltése" mód
 */
export const PaginationMode: Story = {
  args: {
    photos: mockPhotos.slice(0, 20),
    selectedIds: [1, 3],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: false,
    pageSize: 20,
    totalPhotosCount: 50,
    readonly: false,
  },
};

/**
 * LargeDataset - Nagy lista pagination módban
 */
export const LargeDatasetPagination: Story = {
  args: {
    photos: largeMockPhotos.slice(0, 100),
    selectedIds: [1, 50, 100],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: false,
    pageSize: 100,
    totalPhotosCount: 350,
    readonly: false,
  },
};

/**
 * LargeDatasetVirtualScroll - Nagy lista virtual scroll módban
 */
export const LargeDatasetVirtualScroll: Story = {
  args: {
    photos: largeMockPhotos,
    selectedIds: [1, 50, 100, 200, 300],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * WithMaxSelection - Maximum kiválasztás limittel
 */
export const WithMaxSelection: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [1, 2, 3, 4, 5],
    allowMultiple: true,
    maxSelection: 5,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * SingleSelect - Egy képes kiválasztás mód
 */
export const SingleSelect: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [5],
    allowMultiple: false,
    maxSelection: 1,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * Readonly - Csak olvasható mód
 */
export const Readonly: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [1, 5, 10, 15],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: true,
  },
};

/**
 * Loading - Betöltés állapot
 */
export const Loading: Story = {
  args: {
    photos: [],
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: true,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * Empty - Üres állapot
 */
export const Empty: Story = {
  args: {
    photos: [],
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    emptyMessage: 'Nincs megjeleníthető kép',
    emptyDescription: 'Lépj vissza az előző lépésre, és válaszd ki a képeket.',
    readonly: false,
  },
};

/**
 * Saving - Mentés állapot
 */
export const Saving: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [1, 5, 10],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    isSaving: true,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * SaveSuccess - Sikeres mentés állapot
 */
export const SaveSuccess: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [1, 5, 10],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    saveSuccess: true,
    useVirtualScroll: true,
    readonly: false,
  },
};

/**
 * DarkMode - Sötét mód
 */
export const DarkMode: Story = {
  args: {
    photos: mockPhotos,
    selectedIds: [1, 5, 10],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story: () => { template?: string; props?: Record<string, unknown> }) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b; min-height: 500px;">${story().template || '<app-selection-grid [photos]="photos" [selectedIds]="selectedIds" [allowMultiple]="allowMultiple" [maxSelection]="maxSelection" [isLoading]="isLoading" [useVirtualScroll]="useVirtualScroll" [readonly]="readonly" />'}</div>`,
      props: story().props,
    }),
  ],
};

/**
 * PaginationDarkMode - Pagination sötét módban
 */
export const PaginationDarkMode: Story = {
  args: {
    photos: mockPhotos.slice(0, 20),
    selectedIds: [1, 3],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: false,
    pageSize: 20,
    totalPhotosCount: 50,
    readonly: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story: () => { template?: string; props?: Record<string, unknown> }) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b; min-height: 500px;">${story().template || '<app-selection-grid [photos]="photos" [selectedIds]="selectedIds" [useVirtualScroll]="useVirtualScroll" [pageSize]="pageSize" [totalPhotosCount]="totalPhotosCount" />'}</div>`,
      props: story().props,
    }),
  ],
};
