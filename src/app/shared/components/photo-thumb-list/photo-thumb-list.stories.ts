import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PhotoThumbListComponent, ThumbPhoto } from './photo-thumb-list.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

const MOCK_PHOTOS: ThumbPhoto[] = [
  { id: 1, thumbUrl: 'https://picsum.photos/seed/1/100/100', originalName: 'foto_001.jpg' },
  { id: 2, thumbUrl: 'https://picsum.photos/seed/2/100/100', originalName: 'foto_002.jpg' },
  { id: 3, thumbUrl: 'https://picsum.photos/seed/3/100/100', originalName: 'foto_003.jpg' },
  { id: 4, thumbUrl: 'https://picsum.photos/seed/4/100/100', originalName: 'foto_004.jpg' },
  { id: 5, thumbUrl: 'https://picsum.photos/seed/5/100/100', originalName: 'foto_005.jpg' },
];

const meta: Meta<PhotoThumbListComponent> = {
  title: 'Shared/Layout/PhotoThumbList',
  component: PhotoThumbListComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PhotoThumbListComponent, MatTooltipModule, LucideAngularModule],
    }),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Thumbnail méret',
    },
    highlight: { control: 'boolean', description: 'Kiemelés' },
  },
};

export default meta;
type Story = StoryObj<PhotoThumbListComponent>;

/** Alapértelmezett - közepes méret */
export const Default: Story = {
  args: {
    photos: MOCK_PHOTOS,
    size: 'md',
    highlight: false,
  },
};

/** Kis méret */
export const KisMeret: Story = {
  args: {
    photos: MOCK_PHOTOS,
    size: 'sm',
    highlight: false,
  },
};

/** Nagy méret */
export const NagyMeret: Story = {
  args: {
    photos: MOCK_PHOTOS,
    size: 'lg',
    highlight: false,
  },
};

/** Kiemelt */
export const Kiemelt: Story = {
  args: {
    photos: MOCK_PHOTOS,
    size: 'md',
    highlight: true,
  },
};

/** Kevés kép */
export const KevesKep: Story = {
  args: {
    photos: MOCK_PHOTOS.slice(0, 2),
    size: 'md',
    highlight: false,
  },
};

/** Hiányzó kép URL */
export const HianyzoKep: Story = {
  args: {
    photos: [
      { id: 1, thumbUrl: null, originalName: 'hianyzo.jpg' },
      { id: 2, thumbUrl: 'https://picsum.photos/seed/2/100/100', originalName: 'foto.jpg' },
    ],
    size: 'md',
    highlight: false,
  },
};
