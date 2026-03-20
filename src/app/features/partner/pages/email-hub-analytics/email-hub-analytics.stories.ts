import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EmailHubAnalyticsComponent } from './email-hub-analytics.component';
import { LoggerService } from '../../../../core/services/logger.service';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

const MOCK_SEASON_REPORT = {
  overview: {
    total_projects: 24,
    total_hours: 186,
    total_included_hours: 150,
    total_overage_hours: 36,
    total_overage_revenue: 54000,
    avg_utilization_pct: 78.5,
  },
  work_type_stats: [
    { work_type: 'face_swap', entry_count: 45, avg_minutes: 12, min_minutes: 5, max_minutes: 25, std_dev: 4.2 },
    { work_type: 'retouch', entry_count: 82, avg_minutes: 18, min_minutes: 8, max_minutes: 40, std_dev: 7.1 },
    { work_type: 'background_change', entry_count: 31, avg_minutes: 22, min_minutes: 10, max_minutes: 45, std_dev: 8.5 },
    { work_type: 'text_correction', entry_count: 56, avg_minutes: 5, min_minutes: 2, max_minutes: 15, std_dev: 2.8 },
    { work_type: 'color_adjustment', entry_count: 28, avg_minutes: 8, min_minutes: 3, max_minutes: 20, std_dev: 3.9 },
  ],
  ai_accuracy: {
    total_compared: 120,
    overall_accuracy: 85.3,
    by_work_type: {
      face_swap: { count: 30, avg_accuracy_pct: 88, avg_estimated: 14, avg_actual: 12, bias: 2 },
      retouch: { count: 50, avg_accuracy_pct: 82, avg_estimated: 20, avg_actual: 18, bias: 2 },
      background_change: { count: 20, avg_accuracy_pct: 78, avg_estimated: 18, avg_actual: 22, bias: -4 },
      text_correction: { count: 20, avg_accuracy_pct: 92, avg_estimated: 5, avg_actual: 5, bias: 0 },
    },
  },
  revenue: {
    total_overage_revenue_ft: 54000,
    projects_with_overage: 8,
    projects_within_budget: 16,
    avg_overage_per_project: 6750,
    max_overage: 18500,
  },
};

class MockHttpClient {
  get(_url: string) {
    return of({ data: MOCK_SEASON_REPORT });
  }
}

const meta: Meta<EmailHubAnalyticsComponent> = {
  title: 'Partner/EmailHub/Analytics',
  component: EmailHubAnalyticsComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: HttpClient, useClass: MockHttpClient },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<EmailHubAnalyticsComponent>;

/** Alapertelmezett - Szezon analitika */
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
