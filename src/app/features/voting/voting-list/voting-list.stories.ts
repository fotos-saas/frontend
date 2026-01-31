import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { VotingListComponent } from './voting-list.component';
import { VotingCardComponent } from '../voting-card/voting-card.component';
import { VotingService, Poll } from '../../../core/services/voting.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';

/**
 * Voting List Stories
 * Szavazások lista oldal - Storybook demo
 *
 * Állapotok tesztelése:
 * - Default (betöltött lista)
 * - Loading (betöltés)
 * - Empty (üres lista)
 * - WithPolls (több szavazás)
 * - GuestView (vendég nézet)
 * - AdminView (kapcsolattartó nézet)
 * - DarkMode
 * - Accessibility (a11y)
 */

// Mock Poll adatok
const createMockPoll = (id: number, overrides: Partial<Poll> = {}): Poll => ({
  id,
  title: `Szavazás #${id}`,
  description: 'Teszt szavazás leírása',
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
  totalVotes: 10 + id * 5,
  uniqueVoters: 8 + id * 3,
  optionsCount: 4,
  options: [],
  participationRate: 50 + id * 10,
  createdAt: '2025-01-10T10:00:00Z',
  ...overrides
});

const mockPolls: Poll[] = [
  createMockPoll(1, { title: 'Milyen hátteret válasszunk?', myVotes: [1] }),
  createMockPoll(2, { title: 'Melyik betűtípust preferáljátok?', isOpen: true }),
  createMockPoll(3, { title: 'Mikor legyen a fotózás?', isOpen: false }),
];

// Mock services
const mockVotingService = {
  loadPolls: () => of(mockPolls),
  polls$: of(mockPolls),
  isLoading: { set: () => {} },
  createPoll: () => of({}),
  setClassSize: () => of({ expected_class_size: 25 }),
};

const mockAuthService = {
  isGuest: () => false,
  hasFullAccess: () => true,
  getProject: () => ({ id: 1, name: 'Test Project', expectedClassSize: 25 }),
  project$: of({ id: 1, name: 'Test Project', expectedClassSize: 25 }),
};

const mockGuestService = {
  hasRegisteredSession: () => true,
  register: () => of({ success: true }),
  getSessionToken: () => 'test-token',
};

const meta: Meta<VotingListComponent> = {
  title: 'Features/Voting/Voting List',
  component: VotingListComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        VotingCardComponent,
      ],
      providers: [
        { provide: VotingService, useValue: mockVotingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestService, useValue: mockGuestService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Szavazások lista oldal. Megjeleníti az aktív és lezárt szavazásokat grid nézetben.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<VotingListComponent>;

// ============================================================================
// DEFAULT STATE (Betöltött lista)
// ============================================================================

/**
 * Default state: betöltött szavazások listája
 * - Aktív és lezárt szekciók
 * - Grid elrendezés
 * - Header a létszám és új szavazás gombokkal
 */
export const Default: Story = {
  args: {},
};

// ============================================================================
// LOADING STATE
// ============================================================================

/**
 * Loading state: betöltés folyamatban
 * - Spinner animáció
 * - "Szavazások betöltése..." szöveg
 */
export const Loading: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            loadPolls: () => {
              // Delay to show loading
              return new Promise(() => {});
            },
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// EMPTY STATE
// ============================================================================

/**
 * Empty state: nincs szavazás
 * - Üres állapot ikon
 * - "Még nincs szavazás" üzenet
 * - Új szavazás gomb (admin esetén)
 */
export const Empty: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            loadPolls: () => of([]),
            polls$: of([]),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// WITH MANY POLLS
// ============================================================================

/**
 * Sok szavazással
 * - 6+ szavazás megjelenítése
 * - Grid elrendezés tesztelése
 */
export const WithManyPolls: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: VotingService,
          useValue: {
            ...mockVotingService,
            loadPolls: () => of([
              ...Array.from({ length: 4 }, (_, i) => createMockPoll(i + 1, { title: `Aktív szavazás ${i + 1}` })),
              ...Array.from({ length: 3 }, (_, i) => createMockPoll(i + 5, { title: `Lezárt szavazás ${i + 1}`, isOpen: false })),
            ]),
          },
        },
      ],
    }),
  ],
};

// ============================================================================
// GUEST VIEW (Vendég nézet)
// ============================================================================

/**
 * Vendég felhasználó nézete
 * - Nincs új szavazás gomb
 * - Nincs létszám beállítás
 */
export const GuestView: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: VotingService, useValue: mockVotingService },
        {
          provide: AuthService,
          useValue: {
            ...mockAuthService,
            isGuest: () => true,
            hasFullAccess: () => false,
          },
        },
        { provide: GuestService, useValue: mockGuestService },
      ],
    }),
  ],
};

// ============================================================================
// ADMIN VIEW (Kapcsolattartó nézet)
// ============================================================================

/**
 * Kapcsolattartó nézete
 * - Új szavazás gomb megjelenik
 * - Létszám beállítás gomb megjelenik
 */
export const AdminView: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: VotingService, useValue: mockVotingService },
        {
          provide: AuthService,
          useValue: {
            ...mockAuthService,
            isGuest: () => false,
            hasFullAccess: () => true,
          },
        },
        { provide: GuestService, useValue: mockGuestService },
      ],
    }),
  ],
};

// ============================================================================
// WITHOUT CLASS SIZE (Létszám nélkül)
// ============================================================================

/**
 * Létszám beállítás nélkül (első használat)
 * - Létszám gomb "Létszám" szöveggel
 */
export const WithoutClassSize: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: VotingService, useValue: mockVotingService },
        {
          provide: AuthService,
          useValue: {
            ...mockAuthService,
            getProject: () => ({ id: 1, name: 'Test Project', expectedClassSize: null }),
            project$: of({ id: 1, name: 'Test Project', expectedClassSize: null }),
          },
        },
        { provide: GuestService, useValue: mockGuestService },
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
 * - Keyboard navigáció
 * - ARIA labelek
 * - Screen reader támogatás
 */
export const A11y: Story = {
  parameters: {
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'color-contrast', enabled: true },
          { id: 'heading-order', enabled: true },
        ],
      },
    },
  },
};
