import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EmailHubAiCostsComponent } from './email-hub-ai-costs.component';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { AiCostSummary, AiDailyCost } from '../../models/email-hub.models';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

const MOCK_COST_SUMMARY: AiCostSummary = {
  totalCostUsd: 2.45,
  totalInputTokens: 125000,
  totalOutputTokens: 48000,
  byModel: [
    { model: 'gpt-4o', costUsd: 1.85, callCount: 42 },
    { model: 'gpt-4o-mini', costUsd: 0.60, callCount: 78 },
  ],
  byAction: [
    { action: 'draft_reply', costUsd: 1.20, callCount: 35 },
    { action: 'voice_analysis', costUsd: 0.65, callCount: 12 },
    { action: 'modification_parse', costUsd: 0.40, callCount: 18 },
    { action: 'escalation_check', costUsd: 0.20, callCount: 55 },
  ],
};

const MOCK_DAILY_COSTS: AiDailyCost[] = [
  { date: '2026-03-14', costUsd: 0.32, callCount: 15 },
  { date: '2026-03-15', costUsd: 0.18, callCount: 8 },
  { date: '2026-03-16', costUsd: 0.45, callCount: 22 },
  { date: '2026-03-17', costUsd: 0.28, callCount: 12 },
  { date: '2026-03-18', costUsd: 0.52, callCount: 25 },
  { date: '2026-03-19', costUsd: 0.38, callCount: 18 },
  { date: '2026-03-20', costUsd: 0.32, callCount: 20 },
];

class MockEmailHubService {
  getAiCosts() {
    return of(MOCK_COST_SUMMARY);
  }
  getAiCostsDaily() {
    return of(MOCK_DAILY_COSTS);
  }
}

const meta: Meta<EmailHubAiCostsComponent> = {
  title: 'Partner/EmailHub/AiCosts',
  component: EmailHubAiCostsComponent,
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
type Story = StoryObj<EmailHubAiCostsComponent>;

/** Alapertelmezett - AI koltseg osszesites */
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
