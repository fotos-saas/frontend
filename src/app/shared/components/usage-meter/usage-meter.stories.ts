import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { UsageMeterComponent } from './usage-meter.component';
import type { UsageState } from '../../../features/partner/models/time-credit.models';

const MOCK_USAGE_NORMAL: UsageState = {
  used_minutes: 180,
  included_minutes: 300,
  remaining_minutes: 120,
  percentage: 60,
  state: 'normal',
  overage_minutes: 0,
  overage_started_hours: 0,
  overage_cost: 0,
  overage_rate: 0,
  overage_confirmed: false,
  formatted: {
    used: '3o 0p',
    included: '5o 0p',
    remaining: '2o 0p',
    overage: '0p',
  },
};

const MOCK_USAGE_WARNING: UsageState = {
  used_minutes: 250,
  included_minutes: 300,
  remaining_minutes: 50,
  percentage: 83,
  state: 'warning',
  overage_minutes: 0,
  overage_started_hours: 0,
  overage_cost: 0,
  overage_rate: 0,
  overage_confirmed: false,
  formatted: {
    used: '4o 10p',
    included: '5o 0p',
    remaining: '50p',
    overage: '0p',
  },
};

const MOCK_USAGE_CRITICAL: UsageState = {
  used_minutes: 290,
  included_minutes: 300,
  remaining_minutes: 10,
  percentage: 97,
  state: 'critical',
  overage_minutes: 0,
  overage_started_hours: 0,
  overage_cost: 0,
  overage_rate: 0,
  overage_confirmed: false,
  formatted: {
    used: '4o 50p',
    included: '5o 0p',
    remaining: '10p',
    overage: '0p',
  },
};

const MOCK_USAGE_OVERAGE: UsageState = {
  used_minutes: 360,
  included_minutes: 300,
  remaining_minutes: 0,
  percentage: 120,
  state: 'overage',
  overage_minutes: 60,
  overage_started_hours: 4,
  overage_cost: 9000,
  overage_rate: 1500,
  overage_confirmed: true,
  formatted: {
    used: '6o 0p',
    included: '5o 0p',
    remaining: '0p',
    overage: '1o 0p',
  },
};

const meta: Meta<UsageMeterComponent> = {
  title: 'Shared/UsageMeter',
  component: UsageMeterComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
  ],
};

export default meta;
type Story = StoryObj<UsageMeterComponent>;

/** Alapertelmezett - Normalis hasznalat (60%) */
export const Default: Story = {
  args: {
    usage: MOCK_USAGE_NORMAL,
    compact: false,
  },
};

/** Figyelmeztetes - 83% hasznalat */
export const Warning: Story = {
  args: {
    usage: MOCK_USAGE_WARNING,
    compact: false,
  },
};

/** Kritikus - 97% hasznalat */
export const Critical: Story = {
  args: {
    usage: MOCK_USAGE_CRITICAL,
    compact: false,
  },
};

/** Tullepes - 120% hasznalat */
export const Overage: Story = {
  args: {
    usage: MOCK_USAGE_OVERAGE,
    compact: false,
  },
};

/** Kompakt nezet */
export const Compact: Story = {
  args: {
    usage: MOCK_USAGE_NORMAL,
    compact: true,
  },
};

/** Sotet mod */
export const DarkMode: Story = {
  args: {
    usage: MOCK_USAGE_NORMAL,
    compact: false,
  },
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
