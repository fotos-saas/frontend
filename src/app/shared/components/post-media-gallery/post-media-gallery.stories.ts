import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostMediaGalleryComponent, PostMediaItem } from './post-media-gallery.component';

const MOCK_MEDIA: PostMediaItem[] = [
  { url: 'https://picsum.photos/seed/m1/200/200', fileName: 'csoportkep_01.jpg' },
  { url: 'https://picsum.photos/seed/m2/200/200', fileName: 'csoportkep_02.jpg' },
  { url: 'https://picsum.photos/seed/m3/200/200', fileName: 'csoportkep_03.jpg' },
  { url: 'https://picsum.photos/seed/m4/200/200', fileName: 'tablo_vegleges.jpg' },
];

const meta: Meta<PostMediaGalleryComponent> = {
  title: 'Shared/Content/PostMediaGallery',
  component: PostMediaGalleryComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostMediaGalleryComponent],
    }),
  ],
};

export default meta;
type Story = StoryObj<PostMediaGalleryComponent>;

/** Alapértelmezett - több kép */
export const Default: Story = {
  args: {
    media: MOCK_MEDIA,
  },
};

/** Egy kép */
export const EgyKep: Story = {
  args: {
    media: [MOCK_MEDIA[0]],
  },
};

/** Üres galéria */
export const Ures: Story = {
  args: {
    media: [],
  },
};

/** Sok kép */
export const SokKep: Story = {
  args: {
    media: [
      ...MOCK_MEDIA,
      { url: 'https://picsum.photos/seed/m5/200/200', fileName: 'extra_01.jpg' },
      { url: 'https://picsum.photos/seed/m6/200/200', fileName: 'extra_02.jpg' },
    ],
  },
};
