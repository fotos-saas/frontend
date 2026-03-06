import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { MediaGridComponent, MediaItem } from './media-grid.component';

const MOCK_MEDIA: MediaItem[] = [
  { url: 'https://picsum.photos/seed/mg1/200/200', isImage: true, fileName: 'kep_01.jpg' },
  { url: 'https://picsum.photos/seed/mg2/200/200', isImage: true, fileName: 'kep_02.jpg' },
  { url: 'https://picsum.photos/seed/mg3/200/200', isImage: true, fileName: 'kep_03.jpg' },
  { url: 'https://picsum.photos/seed/mg4/200/200', isImage: true, fileName: 'kep_04.jpg' },
  { url: '/assets/video.mp4', isImage: false, fileName: 'video_01.mp4' },
];

const meta: Meta<MediaGridComponent> = {
  title: 'Shared/Content/MediaGrid',
  component: MediaGridComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [MediaGridComponent],
    }),
  ],
  argTypes: {
    maxVisible: { control: 'number', description: 'Maximum látható elemek' },
    thumbnailSize: { control: 'number', description: 'Thumbnail méret (px)' },
  },
};

export default meta;
type Story = StoryObj<MediaGridComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    media: MOCK_MEDIA.slice(0, 3),
    maxVisible: 3,
    thumbnailSize: 64,
  },
};

/** Több elem mint a maximum */
export const TobbElem: Story = {
  args: {
    media: MOCK_MEDIA,
    maxVisible: 3,
    thumbnailSize: 64,
  },
};

/** Nagy thumbnailek */
export const NagyThumbnailek: Story = {
  args: {
    media: MOCK_MEDIA.slice(0, 3),
    maxVisible: 3,
    thumbnailSize: 96,
  },
};

/** Egy elem */
export const EgyElem: Story = {
  args: {
    media: [MOCK_MEDIA[0]],
    maxVisible: 3,
    thumbnailSize: 64,
  },
};

/** Videó és kép mix */
export const VideoEsKepMix: Story = {
  args: {
    media: [
      { url: 'https://picsum.photos/seed/vk1/200/200', isImage: true, fileName: 'kep.jpg' },
      { url: '/video.mp4', isImage: false, fileName: 'video.mp4' },
      { url: 'https://picsum.photos/seed/vk2/200/200', isImage: true, fileName: 'kep2.jpg' },
    ],
    maxVisible: 4,
    thumbnailSize: 64,
  },
};

/** Üres */
export const Ures: Story = {
  args: {
    media: [],
    maxVisible: 3,
    thumbnailSize: 64,
  },
};
