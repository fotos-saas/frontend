import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { VotingDetailComponent } from './voting-detail.component';
import { VotingService, Poll, PollOption } from '../../../core/services/voting.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';

/**
 * Voting Detail Stories
 * Szavazás részletek oldal - Storybook demo
 *
 * Állapotok tesztelése:
 * - Default (aktív szavazás)
 * - Voted (szavazott)
 * - Closed (lezárt)
 * - MultipleChoice (több választásos)
 * - WithResults (eredményekkel)
 * - DarkMode
 * - Accessibility (a11y)
 */

// Mock Option adatok
const createMockOption = (id: number, overrides: Partial<PollOption> = {}): PollOption => ({
  id,
  label: `Opció ${id}`,
  description: `Az ${id}. opció leírása`,
  imageUrl: null,
  templateId: null,
  templateName: null,
  votesCount: 5 + id * 2,
  percentage: 20 + id * 5,
  ...overrides
});

// Mock Poll adatok
const createMockPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 1,
  title: 'Milyen hátteret válasszunk a tablóhoz?',
  description: 'Válaszd ki a neked legjobban tetsző hátteret. A legtöbb szavazatot kapott opció lesz a végleges.',
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
  totalVotes: 25,
  uniqueVoters: 20,
  optionsCount: 4,
  options: [
    createMockOption(1, { label: 'Kék gradiens háttér', percentage: 40 }),
    createMockOption(2, { label: 'Fehér minimalista', percentage: 25 }),
    createMockOption(3, { label: 'Természetes zöld', percentage: 20 }),
    createMockOption(4, { label: 'Szürke professzionális', percentage: 15 }),
  ],
  participationRate: 80,
  createdAt: '2025-01-10T10:00:00Z',
  ...overrides
});

// Mock services
const mockVotingService = {
  getPoll: (id: number) => of(createMockPoll()),
  vote: () => of({ success: true, message: 'Sikeres szavazat!' }),
  removeVote: () => of({ success: true, message: 'Szavazat visszavonva!' }),
  selectedPoll: { set: () => {} },
};

const mockAuthService = {
  isGuest: () => false,
  hasFullAccess: () => true,
};

const mockGuestService = {
  hasRegisteredSession: () => true,
  register: () => of({ success: true }),
  getSessionToken: () => 'test-token',
};

const mockActivatedRoute = {
  snapshot: {
    paramMap: {
      get: () => '1',
    },
  },
};

const meta: Meta<VotingDetailComponent> = {
  title: 'Features/Voting/Voting Detail',
  component: VotingDetailComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        RouterModule.forRoot([], { useHash: true }),
      ],
      providers: [
        { provide: VotingService, useValue: mockVotingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: 'ActivatedRoute', useValue: mockActivatedRoute },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Szavazás részletei oldal. Megjeleníti az opciókat, eredményeket és lehetővé teszi a szavazást.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<VotingDetailComponent>;

// ============================================================================
// DEFAULT STATE (Aktív, nem szavazott)
// ============================================================================

/**
 * Default state: aktív szavazás, a user még nem szavazott
 * - Opciók listája
 * - Szavazásra hívó üzenet
 * - Kattintható opciók
 */
export const Default: Story = {
  args: {},
};

// ============================================================================
// VOTED STATE (Szavazott)
// ============================================================================

/**
 * Voted state: a user már leadta a szavazatát
 * - Kiválasztott opció kiemelése
 * - Eredmények megjelenítése
 * - Szavazat visszavonás lehetősége
 */
export const Voted: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({ myVotes: [1] })),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// CLOSED STATE (Lezárt)
// ============================================================================

/**
 * Closed state: lezárt szavazás
 * - Eredmények megjelenítése
 * - Opciók nem kattinthatók
 * - "Lezárt szavazás" státusz
 */
export const Closed: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({
              isOpen: false,
              myVotes: [1],
            })),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// MULTIPLE CHOICE (Több választásos)
// ============================================================================

/**
 * Több választásos szavazás
 * - Több opció kiválasztható
 * - Max szavazat jelzése
 */
export const MultipleChoice: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({
              isMultipleChoice: true,
              maxVotesPerGuest: 3,
              myVotes: [1, 2],
            })),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// WITH IMAGES (Képekkel)
// ============================================================================

/**
 * Képes opciókkal
 * - Opciókhoz tartozó képek
 */
export const WithImages: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({
              options: [
                createMockOption(1, {
                  label: 'Kék háttér',
                  imageUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Kék',
                }),
                createMockOption(2, {
                  label: 'Zöld háttér',
                  imageUrl: 'https://via.placeholder.com/300x200/22c55e/ffffff?text=Zöld',
                }),
                createMockOption(3, {
                  label: 'Piros háttér',
                  imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Piros',
                }),
              ],
            })),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// SHOW RESULTS BEFORE VOTE
// ============================================================================

/**
 * Eredmények láthatók szavazás előtt
 * - Progress barok megjelennek
 * - Százalékok láthatók
 */
export const ShowResultsBeforeVote: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({
              showResultsBeforeVote: true,
              myVotes: [],
            })),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// MAX VOTES REACHED
// ============================================================================

/**
 * Maximum szavazat elérve
 * - Nem szavazhat többet
 * - Figyelmeztetés megjelenítése
 */
export const MaxVotesReached: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({
              isMultipleChoice: true,
              maxVotesPerGuest: 2,
              myVotes: [1, 2],
              canVote: false,
            })),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// GUEST VIEW (Vendég nézet - nem regisztrált)
// ============================================================================

/**
 * Nem regisztrált vendég nézete
 * - Guest name dialog megjelenik
 */
export const GuestNotRegistered: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: VotingService, useValue: mockVotingService },
        {
          provide: AuthService,
          useValue: {
            ...mockAuthService,
            isGuest: () => true,
          },
        },
        {
          provide: GuestService,
          useValue: {
            ...mockGuestService,
            hasRegisteredSession: () => false,
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// LOADING STATE
// ============================================================================

/**
 * Betöltés állapot
 * - Spinner megjelenítése
 */
export const Loading: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => new Promise(() => {}), // Never resolves
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// ERROR STATE
// ============================================================================

/**
 * Hiba állapot
 * - Hibaüzenet megjelenítése
 * - Vissza gomb
 */
export const Error: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => {
              throw new Error('Szavazás nem található');
            },
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// DARK MODE
// ============================================================================

/**
 * Dark mode megjelenés
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark-mode" style="min-height: 100vh; background: #1f2937;">${story}</div>`,
    }),
  ],
};

// ============================================================================
// ACCESSIBILITY (A11y)
// ============================================================================

/**
 * Accessibility teszt
 * - Keyboard navigáció az opciók között
 * - ARIA labelek minden elemhez
 * - Screen reader támogatás
 * - Focus management
 */
export const A11y: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            getPoll: () => of(createMockPoll({ myVotes: [1] })),
          },
        },
      ],
    }),
  ],
  parameters: {
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'color-contrast', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'focus-order-semantics', enabled: true },
        ],
      },
    },
  },
};
