import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TimerBarComponent } from './timer-bar.component';
import { TimeCreditService } from '../../../features/partner/services/time-credit.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import type { TimerState } from '../../../features/partner/models/time-credit.models';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

class MockToastService {
  success(_title: string, _message: string): void {}
  error(_title: string, _message: string): void {}
  info(_title: string, _message: string): void {}
  warning(_title: string, _message: string): void {}
}

const MOCK_TIMERS: TimerState[] = [
  {
    id: 1,
    is_running: true,
    is_paused: false,
    project_id: 5,
    project_name: 'Kossuth Lajos Alt. Isk. 8.A',
    work_type: 'retouch',
    description: 'Portre retusalas',
    started_at: '2026-03-20T08:30:00.000Z',
    elapsed_seconds: 2345,
    elapsed_formatted: '00:39:05',
    auto_stop_hours: 8,
    auto_stop_at: '2026-03-20T16:30:00.000Z',
  },
  {
    id: 2,
    is_running: false,
    is_paused: true,
    project_id: 8,
    project_name: 'Petofi Sandor Gimn. 12.B',
    work_type: 'background_change',
    description: 'Hattercsere csoportkep',
    started_at: '2026-03-20T09:00:00.000Z',
    elapsed_seconds: 1080,
    elapsed_formatted: '00:18:00',
    auto_stop_hours: 8,
    auto_stop_at: '2026-03-20T17:00:00.000Z',
  },
];

class MockTimeCreditService {
  timers = signal<TimerState[]>(MOCK_TIMERS);

  loadTimers() {
    return of(MOCK_TIMERS);
  }
  pauseTimer(_id: number) {
    return of(void 0);
  }
  resumeTimer(_id: number) {
    return of(void 0);
  }
  stopTimer(_id: number) {
    return of({ id: _id, minutes: 39 });
  }
  stopAllTimers() {
    return of({ stopped_count: 2 });
  }
}

const meta: Meta<TimerBarComponent> = {
  title: 'Shared/TimerBar',
  component: TimerBarComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: TimeCreditService, useClass: MockTimeCreditService },
        { provide: ToastService, useClass: MockToastService },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<TimerBarComponent>;

/** Alapertelmezett - Aktiv idomerovel */
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
