import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EmailHubDashboardComponent } from './email-hub-dashboard.component';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { EmailHubDashboard } from '../../models/email-hub.models';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

const MOCK_DASHBOARD: EmailHubDashboard = {
  pendingDrafts: 3,
  pendingApproval: 1,
  escalationCount: 0,
  activeRounds: 2,
  todayProcessed: 15,
  monthlyCostUsd: 2.45,
};

class MockEmailHubService {
  getDashboard() {
    return of(MOCK_DASHBOARD);
  }
}

const meta: Meta<EmailHubDashboardComponent> = {
  title: 'Partner/EmailHub/Dashboard',
  component: EmailHubDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ],
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
type Story = StoryObj<EmailHubDashboardComponent>;

/** Alapertelmezett - Dashboard adatokkal */
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
