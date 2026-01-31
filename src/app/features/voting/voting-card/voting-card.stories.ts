import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { VotingCardComponent } from './voting-card.component';
import { Poll } from '../../../core/services/voting.service';

/**
 * Voting Card Stories
 * Szavazás kártya komponens - Storybook demo
 *
 * Állapotok tesztelése:
 * - Default (aktív, nem szavazott)
 * - WithVote (szavazott)
 * - Closed (lezárt)
 * - WithDeadline (határidővel)
 * - DarkMode
 * - Accessibility (a11y)
 */

// Mock Poll adatok
const createMockPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 1,
  title: 'Milyen hátteret válasszunk?',
  description: 'Válaszd ki a tablóhoz leginkább illő hátteret',
  coverImageUrl: null,
  media: [],
  type: 'template',
  isActive: true,
  isMultipleChoice: false,
  maxVotesPerGuest: 1,
  showResultsBeforeVote: false,
  useForFinalization: false,
  closeAt: null,
  isOpen: true,
  canVote: true,
  myVotes: [],
  totalVotes: 15,
  uniqueVoters: 12,
  optionsCount: 4,
  options: [],
  participationRate: 48,
  createdAt: '2025-01-10T10:00:00Z',
  ...overrides
});

const meta: Meta<VotingCardComponent> = {
  title: 'Features/Voting/Voting Card',
  component: VotingCardComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Szavazás kártya komponens. Megjeleníti a szavazás címét, típusát, státuszát és a részvételi arányokat.',
      },
    },
  },
  argTypes: {
    poll: {
      control: 'object',
      description: 'Szavazás adatok (Poll interface)',
    },
    isClosed: {
      control: 'boolean',
      description: 'Explicit lezárt jelzés',
    },
    select: {
      description: 'Kártya kiválasztás event',
    },
  },
};

export default meta;
type Story = StoryObj<VotingCardComponent>;

// ============================================================================
// DEFAULT STATE (Aktív, nem szavazott)
// ============================================================================

/**
 * Default state: aktív szavazás, a user még nem szavazott
 * - Kék státusz badge (Aktív)
 * - Szavazó szám megjelenítése
 * - Kattintható kártya
 */
export const Default: Story = {
  args: {
    poll: createMockPoll(),
    isClosed: false,
    select: action('select'),
  },
};

// ============================================================================
// VOTED STATE (Szavazott)
// ============================================================================

/**
 * Voted state: a user már leadta a szavazatát
 * - Zöld státusz badge (Szavaztál)
 * - Pipa ikon megjelenítése
 */
export const WithVote: Story = {
  args: {
    poll: createMockPoll({
      myVotes: [1],
    }),
    isClosed: false,
    select: action('select'),
  },
};

// ============================================================================
// CLOSED STATE (Lezárt)
// ============================================================================

/**
 * Closed state: lezárt szavazás
 * - Szürke státusz badge (Lezárt)
 * - Nem kattintható (disabled look)
 */
export const Closed: Story = {
  args: {
    poll: createMockPoll({
      isOpen: false,
      myVotes: [1],
    }),
    isClosed: true,
    select: action('select'),
  },
};

// ============================================================================
// WITH DEADLINE (Határidővel)
// ============================================================================

/**
 * Szavazás határidővel
 * - Megjeleníti a hátralévő időt
 */
export const WithDeadline: Story = {
  args: {
    poll: createMockPoll({
      closeAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 nap múlva
    }),
    isClosed: false,
    select: action('select'),
  },
};

/**
 * Szavazás amely hamarosan lejár
 * - Piros figyelmeztetés a határidőről
 */
export const DeadlineSoon: Story = {
  args: {
    poll: createMockPoll({
      closeAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 óra múlva
    }),
    isClosed: false,
    select: action('select'),
  },
};

// ============================================================================
// MULTIPLE CHOICE (Több választásos)
// ============================================================================

/**
 * Több választásos szavazás
 * - Badge jelzi hogy több opció választható
 */
export const MultipleChoice: Story = {
  args: {
    poll: createMockPoll({
      isMultipleChoice: true,
      maxVotesPerGuest: 3,
      myVotes: [1, 2],
    }),
    isClosed: false,
    select: action('select'),
  },
};

// ============================================================================
// CUSTOM TYPE (Szabad szavazás)
// ============================================================================

/**
 * Szabad típusú szavazás (nem sablon)
 */
export const CustomType: Story = {
  args: {
    poll: createMockPoll({
      type: 'custom',
      title: 'Egyéb ötletek a tablóhoz',
    }),
    isClosed: false,
    select: action('select'),
  },
};

// ============================================================================
// HIGH PARTICIPATION (Magas részvétel)
// ============================================================================

/**
 * Magas részvételi aránnyal
 */
export const HighParticipation: Story = {
  args: {
    poll: createMockPoll({
      uniqueVoters: 24,
      totalVotes: 30,
      participationRate: 96,
    }),
    isClosed: false,
    select: action('select'),
  },
};

// ============================================================================
// DARK MODE
// ============================================================================

/**
 * Dark mode megjelenés
 */
export const DarkMode: Story = {
  args: {
    poll: createMockPoll(),
    isClosed: false,
    select: action('select'),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark-mode" style="padding: 2rem; background: #1f2937;">${story}</div>`,
    }),
  ],
};

// ============================================================================
// ACCESSIBILITY (A11y)
// ============================================================================

/**
 * Accessibility teszt
 * - Keyboard navigáció
 * - ARIA labelek
 * - Screen reader támogatás
 */
export const A11y: Story = {
  args: {
    poll: createMockPoll({
      myVotes: [1],
    }),
    isClosed: false,
    select: action('select'),
  },
  parameters: {
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
};
