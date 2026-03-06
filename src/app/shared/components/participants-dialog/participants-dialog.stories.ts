import { Meta, StoryObj } from '@storybook/angular';
import { ParticipantsDialogComponent } from './participants-dialog.component';
import { Participant, ParticipantStatistics } from '../../../core/services/voting.service';

/**
 * ## Participants Dialog
 *
 * Résztvevők listáját megjelenítő dialógus.
 *
 * ### Jellemzők:
 * - Résztvevők listája státusz badge-ekkel (aktív, vendég, tiltott)
 * - Statisztika összesítés (aktív, várható, vendég)
 * - Extra státusz toggle (ha van jogosultság)
 * - Frissítés gomb
 * - Aktuális felhasználó jelölése
 * - DialogWrapperComponent shell
 */

const mockParticipants: Participant[] = [
  {
    id: 1,
    guestName: 'Kiss Péter',
    guestEmail: 'kiss.peter@email.hu',
    isExtra: false,
    isBanned: false,
    lastActivityAt: new Date().toISOString(),
    votesCount: 5,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    guestName: 'Nagy Anna',
    guestEmail: 'nagy.anna@email.hu',
    isExtra: false,
    isBanned: false,
    lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
    votesCount: 12,
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 3,
    guestName: 'Szabó Kata',
    guestEmail: null,
    isExtra: true,
    isBanned: false,
    lastActivityAt: new Date(Date.now() - 86400000).toISOString(),
    votesCount: 2,
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 4,
    guestName: 'Tóth Gábor',
    guestEmail: null,
    isExtra: false,
    isBanned: true,
    lastActivityAt: null,
    votesCount: 0,
    createdAt: '2024-01-18T10:00:00Z',
  },
  {
    id: 5,
    guestName: 'Horváth Éva',
    guestEmail: 'horvath.eva@email.hu',
    isExtra: false,
    isBanned: false,
    lastActivityAt: new Date(Date.now() - 604800000).toISOString(),
    votesCount: 8,
    createdAt: '2024-01-19T10:00:00Z',
  },
];

const mockStatistics: ParticipantStatistics = {
  total: 5,
  active: 4,
  banned: 1,
  extraCount: 1,
  regularCount: 3,
  active24h: 2,
  expectedClassSize: 30,
  participationRate: 13.3,
};

const meta: Meta<ParticipantsDialogComponent> = {
  title: 'Shared/Dialogs/ParticipantsDialog',
  component: ParticipantsDialogComponent,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ParticipantsDialogComponent>;

/**
 * Alapértelmezett állapot - résztvevők listája
 */
export const Default: Story = {
  args: {
    participants: mockParticipants,
    statistics: mockStatistics,
    hasFullAccess: false,
    isLoading: false,
    togglingExtraId: null,
    currentGuestId: 1,
  },
};

/**
 * Teljes hozzáférés - toggle gombok láthatók
 */
export const WithFullAccess: Story = {
  args: {
    participants: mockParticipants,
    statistics: mockStatistics,
    hasFullAccess: true,
    isLoading: false,
    togglingExtraId: null,
    currentGuestId: 1,
  },
};

/**
 * Betöltés állapot
 */
export const Loading: Story = {
  args: {
    participants: [],
    statistics: null,
    hasFullAccess: false,
    isLoading: true,
    togglingExtraId: null,
    currentGuestId: null,
  },
};

/**
 * Üres lista
 */
export const Empty: Story = {
  args: {
    participants: [],
    statistics: { total: 0, active: 0, banned: 0, extraCount: 0, regularCount: 0, active24h: 0, expectedClassSize: 30, participationRate: null },
    hasFullAccess: false,
    isLoading: false,
    togglingExtraId: null,
    currentGuestId: null,
  },
};

/**
 * Extra toggle folyamatban
 */
export const TogglingExtra: Story = {
  args: {
    participants: mockParticipants,
    statistics: mockStatistics,
    hasFullAccess: true,
    isLoading: false,
    togglingExtraId: 3,
    currentGuestId: 1,
  },
};
