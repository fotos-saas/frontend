import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostMetaBarComponent } from './post-meta-bar.component';

const meta: Meta<PostMetaBarComponent> = {
  title: 'Shared/Content/PostMetaBar',
  component: PostMetaBarComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostMetaBarComponent],
    }),
  ],
  argTypes: {
    authorName: { control: 'text', description: 'Szerző neve' },
    createdAt: { control: 'text', description: 'Létrehozás dátuma (ISO)' },
    reactions: { control: 'object', description: 'Reakciók' },
    userReaction: { control: 'text', description: 'Felhasználó reakciója' },
    commentsCount: { control: 'number', description: 'Hozzászólások száma' },
    commentsLabel: { control: 'text', description: 'Hozzászólás label' },
    showComments: { control: 'boolean', description: 'Hozzászólás gomb megjelenítése' },
    commentsActive: { control: 'boolean', description: 'Hozzászólások kinyitva' },
    timeClickable: { control: 'boolean', description: 'Idő kattintható' },
  },
};

export default meta;
type Story = StoryObj<PostMetaBarComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    authorName: 'Kovács Anna',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reactions: {},
    userReaction: null,
    commentsCount: 0,
    showComments: true,
    commentsActive: false,
    timeClickable: false,
  },
};

/** Reakciókkal és hozzászólásokkal */
export const ReakciokkalEsHozzaszolasokkal: Story = {
  args: {
    authorName: 'Nagy Péter',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reactions: { '👍': 5, '❤️': 2 },
    userReaction: '👍',
    commentsCount: 8,
    showComments: true,
    commentsActive: false,
  },
};

/** Aktív hozzászólás panel */
export const AktivHozzaszolasPanel: Story = {
  args: {
    authorName: 'Tóth Gábor',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    reactions: { '👍': 1 },
    userReaction: null,
    commentsCount: 3,
    showComments: true,
    commentsActive: true,
  },
};

/** Hozzászólás gomb nélkül */
export const HozzaszolasNelkul: Story = {
  args: {
    authorName: 'Szabó Eszter',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    reactions: { '❤️': 10 },
    userReaction: '❤️',
    commentsCount: 0,
    showComments: false,
  },
};

/** Kattintható idővel */
export const KattinthatoIdovel: Story = {
  args: {
    authorName: 'Varga Dávid',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    reactions: {},
    userReaction: null,
    commentsCount: 1,
    showComments: true,
    timeClickable: true,
  },
};
