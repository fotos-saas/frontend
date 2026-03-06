import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommentItemComponent } from './comment-item.component';

const meta: Meta<CommentItemComponent> = {
  title: 'Shared/Content/CommentItem',
  component: CommentItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommentItemComponent],
    }),
  ],
  argTypes: {
    authorName: { control: 'text', description: 'Szerző neve' },
    authorType: {
      control: 'select',
      options: ['contact', 'guest', 'user'],
      description: 'Szerző típusa',
    },
    content: { control: 'text', description: 'Hozzászólás tartalma' },
    createdAt: { control: 'text', description: 'Létrehozás ideje (ISO)' },
    isEdited: { control: 'boolean', description: 'Szerkesztve' },
    canDelete: { control: 'boolean', description: 'Törölhető' },
    showReactions: { control: 'boolean', description: 'Reakciók megjelenítése' },
    showReply: { control: 'boolean', description: 'Válasz gomb' },
    noBorder: { control: 'boolean', description: 'Keret nélkül' },
    variant: {
      control: 'select',
      options: ['default', 'pinned', 'event'],
      description: 'Variáns',
    },
    isReply: { control: 'boolean', description: 'Reply-e' },
    isNew: { control: 'boolean', description: 'Új komment jelzés' },
    repliesCount: { control: 'number', description: 'Válaszok száma' },
    repliesExpanded: { control: 'boolean', description: 'Válaszok kinyitva' },
  },
};

export default meta;
type Story = StoryObj<CommentItemComponent>;

/** Alapértelmezett - vendég hozzászólás */
export const Default: Story = {
  args: {
    authorName: 'Kiss Anna',
    authorType: 'guest',
    content: 'Ez egy példa hozzászólás a fórumban.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isEdited: false,
    canDelete: false,
    showReactions: false,
    showReply: false,
    variant: 'default',
    isReply: false,
    isNew: false,
  },
};

/** Kapcsolattartó hozzászólása */
export const Kapcsolattarto: Story = {
  args: {
    ...Default.args,
    authorName: 'Nagy Péter',
    authorType: 'contact',
    content: 'Köszönjük a visszajelzést! Hamarosan válaszolunk.',
  },
};

/** Szerkesztett komment */
export const Szerkesztett: Story = {
  args: {
    ...Default.args,
    authorName: 'Tóth Gábor',
    content: 'Ez egy szerkesztett hozzászólás.',
    isEdited: true,
  },
};

/** Reakciókkal és válasz gombbal */
export const ReakciokkalEsValasszal: Story = {
  args: {
    ...Default.args,
    authorName: 'Szabó Eszter',
    content: 'Nagyon tetszik a tabló! Szuper munka!',
    showReactions: true,
    showReply: true,
    reactions: { '👍': 3, '❤️': 1 },
    userReaction: '👍',
  },
};

/** Kitűzött komment */
export const Kituzott: Story = {
  args: {
    ...Default.args,
    authorName: 'Kovács János',
    authorType: 'contact',
    content: 'Fontos: A képválasztás határideje péntekig tart!',
    variant: 'pinned',
  },
};

/** Esemény variáns */
export const Esemeny: Story = {
  args: {
    ...Default.args,
    authorName: 'Rendszer',
    content: 'A fotózás időpontja megváltozott.',
    variant: 'event',
  },
};

/** Válasz (reply) */
export const Valasz: Story = {
  args: {
    ...Default.args,
    authorName: 'Molnár Zsófi',
    content: 'Köszönöm az információt!',
    isReply: true,
  },
};

/** Törölhető */
export const Torolheto: Story = {
  args: {
    ...Default.args,
    authorName: 'Kiss Anna',
    content: 'Ezt a hozzászólást törölhetem.',
    canDelete: true,
  },
};

/** Válaszokkal */
export const Valaszokkal: Story = {
  args: {
    ...Default.args,
    authorName: 'Varga Dávid',
    content: 'Mikor lesz a fotózás?',
    showReply: true,
    repliesCount: 3,
    repliesExpanded: false,
  },
};

/** Új komment animációval */
export const UjKomment: Story = {
  args: {
    ...Default.args,
    authorName: 'Horváth Lili',
    content: 'Éppen most érkezett hozzászólás!',
    isNew: true,
  },
};
