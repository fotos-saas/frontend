import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactionPickerComponent } from './reaction-picker.component';

/**
 * ## Reaction Picker
 *
 * Ujrafelhasznalhato reakcio valaszto komponens.
 *
 * ### Jellemzok:
 * - Emoji reakciok (💀 😭 🫡 ❤️ 👀)
 * - Megnyithato picker panel
 * - Meglevo reakciok badge-ek szammal
 * - User sajat reakcioja kiemeles
 * - Disabled allapot
 * - Kattintas kivulre: picker bezarodas
 */
const meta: Meta<ReactionPickerComponent> = {
  title: 'Shared/ReactionPicker',
  component: ReactionPickerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReactionPickerComponent],
    }),
  ],
  argTypes: {
    reactions: {
      control: 'object',
      description: 'Reakciok osszesitese (emoji → darabszam)',
    },
    userReaction: {
      control: 'select',
      options: [null, '💀', '😭', '🫡', '❤️', '👀'],
      description: 'Felhasznalo sajat reakcioja',
    },
    disabled: {
      control: 'boolean',
      description: 'Letiltott allapot',
    },
  },
};

export default meta;
type Story = StoryObj<ReactionPickerComponent>;

// ============================================================================
// ALAP VARIANSOK
// ============================================================================

/** Alapertelmezett - reakciok nelkul */
export const Default: Story = {
  args: {
    reactions: {},
    userReaction: null,
    disabled: false,
  },
};

/** Reakciokkal */
export const WithReactions: Story = {
  args: {
    reactions: { '❤️': 5, '💀': 2, '👀': 1 },
    userReaction: null,
    disabled: false,
  },
};

/** Sajat reakcioval (kiemelt badge) */
export const WithUserReaction: Story = {
  args: {
    reactions: { '❤️': 5, '💀': 2, '🫡': 3 },
    userReaction: '❤️',
    disabled: false,
  },
};

/** Egyetlen reakcio */
export const SingleReaction: Story = {
  args: {
    reactions: { '😭': 1 },
    userReaction: '😭',
    disabled: false,
  },
};

/** Sok reakcio mindenfele */
export const ManyReactions: Story = {
  args: {
    reactions: { '❤️': 42, '💀': 15, '😭': 8, '🫡': 23, '👀': 6 },
    userReaction: '🫡',
    disabled: false,
  },
};

/** Letiltott allapot */
export const Disabled: Story = {
  args: {
    reactions: { '❤️': 3 },
    userReaction: null,
    disabled: true,
  },
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/** Sotet mod */
export const DarkMode: Story = {
  args: {
    reactions: { '❤️': 5, '💀': 2, '👀': 1 },
    userReaction: '❤️',
    disabled: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b;"><app-reaction-picker [reactions]="reactions" [userReaction]="userReaction" [disabled]="disabled" /></div>`,
      props: story().props,
    }),
  ],
};

/** Akadalymentessegi variacio */
export const A11y: Story = {
  args: {
    reactions: { '❤️': 3, '😭': 1 },
    userReaction: '❤️',
    disabled: false,
  },
  decorators: [
    (story) => ({
      template: `<div role="region" aria-label="Reakciok"><app-reaction-picker [reactions]="reactions" [userReaction]="userReaction" [disabled]="disabled" /></div>`,
      props: story().props,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'A reakcio valaszto ARIA region-ba csomagolva. Minden emoji badge tooltip-pel rendelkezik a kepernyoolvasok szamara.',
      },
    },
  },
};
