import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EmailHubModificationsComponent } from './email-hub-modifications.component';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { ModificationRound } from '../../models/email-hub.models';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

const MOCK_ROUNDS: ModificationRound[] = [
  {
    id: 1,
    roundNumber: 1,
    status: 'in_progress',
    statusLabel: 'Folyamatban',
    statusColor: 'blue',
    isFree: true,
    priceHuf: null,
    paymentStatus: 'not_required',
    paymentStatusLabel: 'Ingyenes',
    aiSummary: 'Hattercsere es szin korrekciok 3 csoportkepen',
    totalTasks: 5,
    completedTasks: 2,
    progressPercent: 40,
    requestedAt: '2026-03-18T10:00:00.000Z',
    completedAt: null,
    createdAt: '2026-03-18T10:00:00.000Z',
  },
  {
    id: 2,
    roundNumber: 2,
    status: 'completed',
    statusLabel: 'Kesz',
    statusColor: 'green',
    isFree: false,
    priceHuf: 8500,
    paymentStatus: 'paid',
    paymentStatusLabel: 'Fizetve',
    aiSummary: 'Arccsere es retusalas egyeni portreken',
    totalTasks: 3,
    completedTasks: 3,
    progressPercent: 100,
    requestedAt: '2026-03-10T08:30:00.000Z',
    completedAt: '2026-03-12T16:45:00.000Z',
    createdAt: '2026-03-10T08:30:00.000Z',
  },
  {
    id: 3,
    roundNumber: 3,
    status: 'pending',
    statusLabel: 'Varakozik',
    statusColor: 'amber',
    isFree: false,
    priceHuf: 4200,
    paymentStatus: 'pending',
    paymentStatusLabel: 'Fizetes szukseges',
    aiSummary: null,
    totalTasks: 1,
    completedTasks: 0,
    progressPercent: 0,
    requestedAt: '2026-03-20T09:00:00.000Z',
    completedAt: null,
    createdAt: '2026-03-20T09:00:00.000Z',
  },
];

class MockEmailHubService {
  getModificationRounds() {
    return of({
      items: MOCK_ROUNDS,
      pagination: { currentPage: 1, lastPage: 1, perPage: 20, total: 3 },
    });
  }
}

const meta: Meta<EmailHubModificationsComponent> = {
  title: 'Partner/EmailHub/Modifications',
  component: EmailHubModificationsComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: EmailHubService, useClass: MockEmailHubService },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<EmailHubModificationsComponent>;

/** Alapertelmezett - Modositasi korok listaja */
export const Default: Story = {};

/** Sotet mod */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => {
      document.body.classList.add('dark');
      return story();
    },
  ],
};
