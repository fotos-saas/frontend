import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommentItemComponent } from './comment-item.component';

/**
 * ## Comment Item
 *
 * Ujrafelhasznalhato hozzaszolas komponens forum stilusban.
 *
 * ### Jellemzok:
 * - Szerzo nev + avatar + badge
 * - Reakciok (ReactionPicker)
 * - Valasz gomb, replies toggle
 * - Pinned / event / default variant (buborek szin)
 * - Reply mod (vilagosabb buborek)
 * - Torles, szerkesztes jelzes
 */
const meta: Meta<CommentItemComponent> = {
  title: 'Shared/CommentItem',
  component: CommentItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommentItemComponent],
    }),
  ],
  argTypes: {
    authorName: {
      control: 'text',
      description: 'Szerzo neve',
    },
    authorType: {
      control: 'select',
      options: ['contact', 'guest', 'user'],
      description: 'Szerzo tipusa (badge)',
    },
    content: {
      control: 'text',
      description: 'Hozzaszolas szovege',
    },
    createdAt: {
      control: 'text',
      description: 'Letrehozas ideje (ISO string)',
    },
    isEdited: {
      control: 'boolean',
      description: 'Szerkesztve lett-e',
    },
    canDelete: {
      control: 'boolean',
      description: 'Torolheto-e',
    },
    showReactions: {
      control: 'boolean',
      description: 'Reakciok megjelenitese',
    },
    showReply: {
      control: 'boolean',
      description: 'Valasz gomb megjelenitese',
    },
    variant: {
      control: 'select',
      options: ['default', 'pinned', 'event'],
      description: 'Buborek szin (default/pinned/event)',
    },
    isReply: {
      control: 'boolean',
      description: 'Reply-e (vilagosabb buborek)',
    },
    noBorder: {
      control: 'boolean',
      description: 'Border nelkuli megjelenes',
    },
    repliesCount: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Valaszok szama',
    },
    repliesExpanded: {
      control: 'boolean',
      description: 'Valaszok kinyitva',
    },
    isNew: {
      control: 'boolean',
      description: 'Uj komment jelzes (animacio)',
    },
  },
};

export default meta;
type Story = StoryObj<CommentItemComponent>;

// ============================================================================
// ALAP VARIANSOK
// ============================================================================

/** Alapertelmezett hozzaszolas */
export const Default: Story = {
  args: {
    authorName: 'Kovacs Janos',
    authorType: 'guest',
    content: 'Ez egy proba hozzaszolas a forum bejegyzeshez.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isEdited: false,
    canDelete: false,
    showReactions: false,
    showReply: false,
    variant: 'default',
    isReply: false,
    noBorder: false,
    repliesCount: 0,
    repliesExpanded: false,
    isNew: false,
  },
};

/** Reakciokkal es valasz gombbal */
export const WithReactionsAndReply: Story = {
  args: {
    authorName: 'Kiss Bela',
    authorType: 'contact',
    content: 'Nagyon tetszik a tablos kepe a gyerekeknek, remek munka!',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isEdited: false,
    canDelete: true,
    showReactions: true,
    reactions: { '❤️': 3, '👀': 1 },
    userReaction: '❤️',
    showReply: true,
    variant: 'default',
    repliesCount: 2,
    repliesExpanded: false,
  },
};

/** Szerkesztett, torolheto */
export const EditedDeletable: Story = {
  args: {
    authorName: 'Nagy Maria',
    authorType: 'user',
    content: 'Ezt a hozzaszolast utana szerkesztettem.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isEdited: true,
    canDelete: true,
    showReactions: true,
    showReply: false,
    variant: 'default',
  },
};

/** Kiemelt (pinned) variant */
export const Pinned: Story = {
  args: {
    authorName: 'Admin Felhasznalo',
    authorType: 'user',
    content: 'Ez egy kiemelt, fontos hozzaszolas, ami sarga/narancs szinben jelenik meg.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    variant: 'pinned',
    showReactions: true,
    reactions: { '🫡': 5 },
  },
};

/** Esemeny (event) variant */
export const Event: Story = {
  args: {
    authorName: 'Rendszer',
    authorType: 'user',
    content: 'Az album veglegesitve lett. Gratulalok!',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    variant: 'event',
  },
};

/** Valasz (reply) mod */
export const Reply: Story = {
  args: {
    authorName: 'Szabo Peter',
    authorType: 'guest',
    content: 'Koszonom a visszajelzest!',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    isReply: true,
    noBorder: true,
    showReactions: true,
  },
};

/** Kinyitott valaszokkal */
export const WithExpandedReplies: Story = {
  args: {
    authorName: 'Kovacs Anna',
    authorType: 'contact',
    content: 'Kerdezni szeretnek a kepekkel kapcsolatban.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    showReply: true,
    repliesCount: 5,
    repliesExpanded: true,
    showReactions: true,
    reactions: { '❤️': 2, '😭': 1 },
  },
};

/** Uj komment (animacioval) */
export const NewComment: Story = {
  args: {
    authorName: 'Uj Felhasznalo',
    authorType: 'guest',
    content: 'Epp most irtam ezt a hozzaszolast!',
    createdAt: new Date().toISOString(),
    isNew: true,
    showReactions: true,
  },
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/** Sotet mod */
export const DarkMode: Story = {
  args: {
    authorName: 'Kovacs Janos',
    authorType: 'contact',
    content: 'Sotet modban is jol kell kineznie a hozzaszolasnak.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    showReactions: true,
    reactions: { '❤️': 4, '💀': 1 },
    userReaction: '❤️',
    showReply: true,
    repliesCount: 3,
    canDelete: true,
    isEdited: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b;"><app-comment-item [authorName]="authorName" [authorType]="authorType" [content]="content" [createdAt]="createdAt" [showReactions]="showReactions" [reactions]="reactions" [userReaction]="userReaction" [showReply]="showReply" [repliesCount]="repliesCount" [canDelete]="canDelete" [isEdited]="isEdited" /></div>`,
      props: story().props,
    }),
  ],
};

/** Akadalymentessegi variacio */
export const A11y: Story = {
  args: {
    authorName: 'Teszt Felhasznalo',
    authorType: 'guest',
    content: 'Akadalymentessegi variacio: region role es aria-label.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    showReactions: true,
    showReply: true,
    repliesCount: 1,
  },
  decorators: [
    (story) => ({
      template: `<div role="region" aria-label="Hozzaszolas szekció"><app-comment-item [authorName]="authorName" [authorType]="authorType" [content]="content" [createdAt]="createdAt" [showReactions]="showReactions" [showReply]="showReply" [repliesCount]="repliesCount" /></div>`,
      props: story().props,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'A komponens ARIA region-ba csomagolva a kepernyoolvasok szamara.',
      },
    },
  },
};
