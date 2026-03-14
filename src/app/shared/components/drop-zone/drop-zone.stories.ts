import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { LucideAngularModule } from 'lucide-angular';
import { DropZoneComponent } from './drop-zone.component';
import type { FileUploadProgress } from '../../../core/models/upload-progress.models';

const meta: Meta<DropZoneComponent> = {
  title: 'Shared/DropZone',
  component: DropZoneComponent,
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule],
    }),
  ],
  tags: ['autodocs'],
  argTypes: {
    uploading: { control: 'boolean', description: 'Feltöltés folyamatban van-e' },
    uploadProgress: { control: { type: 'range', min: 0, max: 100 }, description: 'Feltöltési progress (0-100)' },
    accept: { control: 'text', description: 'Elfogadott fájltípusok' },
    maxSize: { control: 'text', description: 'Maximum méret szövege' },
    hint: { control: 'text', description: 'Hint szöveg (formátumok)' },
  },
};

export default meta;
type Story = StoryObj<DropZoneComponent>;

/** Default - alapértelmezett megjelenés, nincs feltöltés */
export const Default: Story = {
  args: {
    uploading: false,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
};

/** ZIP-et is elfogadó változat */
export const WithZipSupport: Story = {
  name: 'ZIP támogatással',
  args: {
    uploading: false,
    accept: '.jpg,.jpeg,.png,.webp,.zip',
    maxSize: 'max. 50 kép',
    hint: 'JPG, PNG, WebP vagy ZIP',
  },
};

/** Feltöltés folyamatban (egyszerű progress bar) */
export const Uploading: Story = {
  name: 'Feltöltés folyamatban',
  args: {
    uploading: true,
    uploadProgress: 45,
  },
};

/** Részletes feltöltési állapot - feltöltési fázis */
export const DetailedProgressUploading: Story = {
  name: 'Részletes progress (feltöltés)',
  args: {
    uploading: true,
    detailedProgress: {
      phase: 'uploading',
      transferProgress: 62,
      processingProgress: 0,
      overallProgress: 62,
      currentChunk: 3,
      totalChunks: 5,
      uploadedCount: 12,
      totalCount: 25,
      errorCount: 0,
      completed: false,
      photos: [],
    } satisfies FileUploadProgress,
  },
};

/** Részletes feltöltési állapot - ZIP feldolgozás */
export const DetailedProgressProcessing: Story = {
  name: 'Részletes progress (feldolgozás)',
  args: {
    uploading: true,
    detailedProgress: {
      phase: 'processing',
      transferProgress: 100,
      processingProgress: 40,
      overallProgress: 70,
      currentChunk: 1,
      totalChunks: 1,
      uploadedCount: 10,
      totalCount: 25,
      errorCount: 0,
      completed: false,
      photos: [],
    } satisfies FileUploadProgress,
  },
};

/** Feltöltés hibával */
export const DetailedProgressWithErrors: Story = {
  name: 'Feltöltés hibákkal',
  args: {
    uploading: true,
    detailedProgress: {
      phase: 'uploading',
      transferProgress: 80,
      processingProgress: 0,
      overallProgress: 80,
      currentChunk: 4,
      totalChunks: 5,
      uploadedCount: 18,
      totalCount: 25,
      errorCount: 2,
      completed: false,
      photos: [],
    } satisfies FileUploadProgress,
  },
};

/** Feltöltés kész */
export const DetailedProgressCompleted: Story = {
  name: 'Feltöltés kész',
  args: {
    uploading: true,
    detailedProgress: {
      phase: 'completed',
      transferProgress: 100,
      processingProgress: 100,
      overallProgress: 100,
      currentChunk: 5,
      totalChunks: 5,
      uploadedCount: 25,
      totalCount: 25,
      errorCount: 0,
      completed: true,
      photos: [],
    } satisfies FileUploadProgress,
  },
};

/** Sötét mód */
export const DarkMode: Story = {
  name: 'Sötét mód',
  args: {
    uploading: false,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
  decorators: [
    () => ({ styles: [':host { background: #1e293b; }'] }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="padding: 20px;">
        <app-drop-zone
          [uploading]="uploading"
          [accept]="accept"
          [maxSize]="maxSize"
          [hint]="hint"
        />
      </div>`,
  }),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Akadálymentesség (A11y) */
export const A11y: Story = {
  name: 'Akadálymentesség',
  args: {
    uploading: false,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
  render: (args) => ({
    props: args,
    template: `
      <div role="region" aria-label="Fájl feltöltési terület">
        <app-drop-zone
          [uploading]="uploading"
          [accept]="accept"
          [maxSize]="maxSize"
          [hint]="hint"
        />
      </div>`,
  }),
};
