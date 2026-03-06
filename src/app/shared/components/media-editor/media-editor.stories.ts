import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { MediaEditorComponent, MediaEditorItem } from './media-editor.component';

const MOCK_EXISTING: MediaEditorItem[] = [
  { id: 1, url: 'https://picsum.photos/seed/me1/100/100', fileName: 'foto_01.jpg', isImage: true },
  { id: 2, url: 'https://picsum.photos/seed/me2/100/100', fileName: 'foto_02.jpg', isImage: true },
  { id: 3, url: 'https://picsum.photos/seed/me3/100/100', fileName: 'video_01.mp4', isImage: false },
];

const meta: Meta<MediaEditorComponent> = {
  title: 'Shared/Content/MediaEditor',
  component: MediaEditorComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [MediaEditorComponent],
    }),
  ],
  argTypes: {
    existingMedia: { control: 'object', description: 'Meglévő médiák' },
    maxFiles: { control: 'number', description: 'Maximum fájlok száma' },
    maxSizeMB: { control: 'number', description: 'Maximum fájl méret (MB)' },
    disabled: { control: 'boolean', description: 'Letiltott állapot' },
    existingLabel: { control: 'text', description: 'Meglévő média címke' },
    newLabel: { control: 'text', description: 'Új média címke' },
  },
};

export default meta;
type Story = StoryObj<MediaEditorComponent>;

/** Alapértelmezett - üres */
export const Default: Story = {
  args: {
    existingMedia: [],
    maxFiles: 5,
    maxSizeMB: 10,
    disabled: false,
  },
};

/** Meglévő médiákkal */
export const MeglevoMediakkal: Story = {
  args: {
    existingMedia: MOCK_EXISTING,
    maxFiles: 5,
    maxSizeMB: 10,
    disabled: false,
  },
};

/** Letiltott állapot */
export const Letiltott: Story = {
  args: {
    existingMedia: MOCK_EXISTING,
    maxFiles: 5,
    maxSizeMB: 10,
    disabled: true,
  },
};

/** Egyedi címkékkel */
export const EgyediCimkekkel: Story = {
  args: {
    existingMedia: [],
    maxFiles: 3,
    maxSizeMB: 5,
    disabled: false,
    existingLabel: 'Feltöltött dokumentumok',
    newLabel: 'Új dokumentumok csatolása',
  },
};

/** Maximum elérve */
export const MaximumElerve: Story = {
  args: {
    existingMedia: [
      { id: 1, url: 'https://picsum.photos/seed/max1/100/100', fileName: 'kep_01.jpg', isImage: true },
      { id: 2, url: 'https://picsum.photos/seed/max2/100/100', fileName: 'kep_02.jpg', isImage: true },
      { id: 3, url: 'https://picsum.photos/seed/max3/100/100', fileName: 'kep_03.jpg', isImage: true },
    ],
    maxFiles: 3,
    maxSizeMB: 10,
    disabled: false,
  },
};
