import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, Upload, FileImage } from 'lucide-angular';
import { DropZoneComponent } from './drop-zone.component';

const meta: Meta<DropZoneComponent> = {
  title: 'Shared/UI/DropZone',
  component: DropZoneComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        DropZoneComponent,
        LucideAngularModule.pick({ Upload, FileImage }),
      ],
    }),
  ],
  argTypes: {
    uploading: {
      control: 'boolean',
      description: 'Feltöltés folyamatban van-e',
    },
    uploadProgress: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Feltöltési folyamat (%)',
    },
    accept: {
      control: 'text',
      description: 'Elfogadott fájltípusok',
    },
    maxSize: {
      control: 'text',
      description: 'Maximum méret szövege',
    },
    hint: {
      control: 'text',
      description: 'Formátum hint szöveg',
    },
  },
};

export default meta;
type Story = StoryObj<DropZoneComponent>;

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    uploading: false,
    uploadProgress: 0,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
};

/** Feltöltés folyamatban */
export const Uploading: Story = {
  args: {
    uploading: true,
    uploadProgress: 45,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
};

/** Feltöltés majdnem kész */
export const AlmostDone: Story = {
  args: {
    uploading: true,
    uploadProgress: 92,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
};

/** ZIP is elfogadott */
export const WithZipSupport: Story = {
  args: {
    uploading: false,
    uploadProgress: 0,
    accept: '.jpg,.jpeg,.png,.webp,.zip',
    maxSize: 'max. 50 kép',
    hint: 'JPG, PNG, WebP vagy ZIP',
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    uploading: false,
    uploadProgress: 0,
    accept: '.jpg,.jpeg,.png,.webp',
    maxSize: '20MB/kép',
    hint: 'JPG, PNG vagy WebP',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
