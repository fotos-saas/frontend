import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { EmptyStateComponent } from './empty-state.component';

/**
 * ## Empty State
 *
 * Ujrafelhasznalhato ures allapot megjelenitese.
 *
 * ### Jellemzok:
 * - Emoji animacio (float effekt)
 * - Ures lista/szuro/kereses eseten hasznalhato
 * - Opcionalis akcio gomb
 * - Compact mod (kisebb padding)
 * - prefers-reduced-motion tamogatas
 * - prefers-color-scheme: dark tamogatas
 */
const meta: Meta<EmptyStateComponent> = {
  title: 'Shared/EmptyState',
  component: EmptyStateComponent,
  decorators: [
    moduleMetadata({
      imports: [EmptyStateComponent],
    }),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    emoji: {
      control: 'text',
      description: 'Emoji karakter (opcio)',
    },
    message: {
      control: 'text',
      description: 'Megjelenito uzenet (kotelezo)',
    },
    buttonText: {
      control: 'text',
      description: 'Akcio gomb szovege (opcio)',
    },
    compact: {
      control: 'boolean',
      description: 'Kompakt megjelenes (kisebb padding)',
    },
  },
};

export default meta;
type Story = StoryObj<EmptyStateComponent>;

// ============================================================================
// ALAP VARIANSOK
// ============================================================================

/**
 * Default - Ures lista allapot
 */
export const Default: Story = {
  args: {
    emoji: '📭',
    message: 'meg nincs egyetlen elem sem',
    compact: false,
  },
};

/**
 * WithAction - Akcio gombbal
 */
export const WithAction: Story = {
  args: {
    emoji: '📸',
    message: 'meg nem toltottel fel kepet',
    buttonText: 'kep feltoltese',
    compact: false,
  },
};

/**
 * WithIllustration - Kulonbozo emojikkal
 */
export const WithIllustration: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="display: flex; flex-wrap: wrap; justify-content: center; max-width: 900px;">
          <div style="margin: 8px; width: 280px;">
            <app-empty-state emoji="🔍" message="nincs talalat a keresedre" />
          </div>
          <div style="margin: 8px; width: 280px;">
            <app-empty-state emoji="📭" message="meg nem kaptad bokest" />
          </div>
          <div style="margin: 8px; width: 280px;">
            <app-empty-state emoji="🎉" message="minden kesz, nincs teendo" />
          </div>
        </div>
      </div>
    `,
  }),
};

// ============================================================================
// VALTOZATOK
// ============================================================================

/**
 * Compact - Kisebb meret
 */
export const Compact: Story = {
  args: {
    emoji: '📋',
    message: 'ures lista',
    compact: true,
  },
  decorators: [
    (story) => ({
      template: `<div style="max-width: 300px; border: 1px solid #e5e7eb; border-radius: 8px;">${'<app-empty-state [emoji]="emoji" [message]="message" [compact]="compact" />'}</div>`,
      props: story().props,
    }),
  ],
};

/**
 * EmojiNelkul - Csak szoveg
 */
export const EmojiNelkul: Story = {
  args: {
    message: 'nincs megjelenitendo tartalom',
    compact: false,
  },
};

/**
 * Kereses ures eredmeny
 */
export const SearchEmpty: Story = {
  args: {
    emoji: '🔍',
    message: 'a keresesi felteteleknek nem felel meg egyetlen elem sem',
    buttonText: 'szurok torlese',
    compact: false,
  },
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/**
 * DarkMode - Sotet hatter
 */
export const DarkMode: Story = {
  args: {
    emoji: '🌙',
    message: 'sotet modban is jol nez ki',
    buttonText: 'akcio gomb',
    compact: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div style="padding: 2rem; background: #1e293b;">${'<app-empty-state [emoji]="emoji" [message]="message" [buttonText]="buttonText" [compact]="compact" />'}</div>`,
      props: story().props,
    }),
  ],
};

/**
 * A11y - Akadalymentesseg
 */
export const A11y: Story = {
  args: {
    emoji: '♿',
    message: 'prefers-reduced-motion mediaquery eseten az animacio le van tiltva',
    buttonText: 'gomb (hover/active stilus)',
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Az emoji float animacio es a gomb hover effekt automatikusan ki van kapcsolva prefers-reduced-motion eseten.',
      },
    },
  },
};
