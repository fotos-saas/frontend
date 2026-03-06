import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ForumPostComponent } from './forum-post.component';

const meta: Meta<ForumPostComponent> = {
  title: 'Shared/Content/ForumPost',
  component: ForumPostComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ForumPostComponent],
    }),
  ],
  argTypes: {
    authorName: { control: 'text', description: 'Szerző neve' },
    authorType: {
      control: 'select',
      options: ['contact', 'guest', 'user'],
      description: 'Szerző típusa',
    },
    content: { control: 'text', description: 'HTML tartalom' },
    createdAt: { control: 'text', description: 'Létrehozás ideje (ISO)' },
    isEdited: { control: 'boolean', description: 'Szerkesztve' },
    canEdit: { control: 'boolean', description: 'Szerkeszthető' },
    canDelete: { control: 'boolean', description: 'Törölhető' },
    canReply: { control: 'boolean', description: 'Válaszolható' },
    isReply: { control: 'boolean', description: 'Reply megjelenés' },
    isEditing: { control: 'boolean', description: 'Szerkesztés módban' },
    highlightColor: { control: 'color', description: 'Kiemelés szín' },
    badgeText: { control: 'text', description: 'Egyedi badge szöveg' },
  },
};

export default meta;
type Story = StoryObj<ForumPostComponent>;

/** Alapértelmezett - vendég poszt */
export const Default: Story = {
  args: {
    authorName: 'Kiss Anna',
    authorType: 'guest',
    content: '<p>Sziasztok! Mikor lesz a fotózás? Előre is köszönöm a választ!</p>',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isEdited: false,
    canEdit: false,
    canDelete: false,
    canReply: true,
    reactions: {},
    userReaction: null,
    media: [],
    isReply: false,
    isEditing: false,
  },
};

/** Kapcsolattartó poszt - kiemelve */
export const KapcsolattartoPosztja: Story = {
  args: {
    ...Default.args,
    authorName: 'Nagy Péter',
    authorType: 'contact',
    content: '<p><strong>Fontos bejelentés!</strong></p><p>A fotózás március 15-én lesz. Kérjük, mindenki hozzon fehér felsőt!</p>',
    highlightColor: '#3b82f6',
    canEdit: true,
    canDelete: true,
    reactions: { '👍': 12, '❤️': 5 },
  },
};

/** Szerkesztett poszt */
export const SzerkesztettPoszt: Story = {
  args: {
    ...Default.args,
    authorName: 'Tóth Gábor',
    content: '<p>Javítottam az időpontot, elnézést a félreértésért.</p>',
    isEdited: true,
    canEdit: true,
    canDelete: true,
  },
};

/** Válasz (reply) */
export const ValaszPoszt: Story = {
  args: {
    ...Default.args,
    authorName: 'Molnár Zsófi',
    content: '<p>Köszönjük a tájékoztatást!</p>',
    isReply: true,
    canReply: false,
  },
};

/** Médiával */
export const Mediaval: Story = {
  args: {
    ...Default.args,
    authorName: 'Szabó Eszter',
    content: '<p>Íme néhány mintafotó a tavalyi tablóról:</p>',
    media: [
      { url: 'https://picsum.photos/seed/fp1/200/200', fileName: 'minta_01.jpg' },
      { url: 'https://picsum.photos/seed/fp2/200/200', fileName: 'minta_02.jpg' },
      { url: 'https://picsum.photos/seed/fp3/200/200', fileName: 'minta_03.jpg' },
    ],
  },
};

/** Egyedi badge-dzsel */
export const EgyediBadge: Story = {
  args: {
    ...Default.args,
    authorName: 'Dr. Kovács Mária',
    authorType: 'user',
    content: '<p>Az osztály nevében gratulálok a fotósnak!</p>',
    badgeText: 'Osztályfőnök',
  },
};

/** Minden funkcióval */
export const MindenFunkcio: Story = {
  args: {
    authorName: 'Nagy Péter',
    authorType: 'contact',
    content: '<p>Komplex poszt minden funkcióval: reakciók, média, szerkesztés.</p>',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isEdited: true,
    canEdit: true,
    canDelete: true,
    canReply: true,
    reactions: { '👍': 8, '❤️': 3, '😂': 1 },
    userReaction: '👍',
    media: [
      { url: 'https://picsum.photos/seed/all1/200/200', fileName: 'kep_01.jpg' },
    ],
    highlightColor: '#3b82f6',
    remainingEditTime: '3 perc',
  },
};
