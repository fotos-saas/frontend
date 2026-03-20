import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EmailHubVoiceProfileComponent } from './email-hub-voice-profile.component';
import { EmailHubService } from '../../services/email-hub.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { VoiceProfile } from '../../models/email-hub.models';

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

const MOCK_VOICE_PROFILE: VoiceProfile = {
  id: 1,
  styleDescription: 'Kedves, informalis hangnem. Rovid mondatok, baratságos megszolitas. Gyakran hasznal felkialtojeleket es pozitiv megfogalmazasokat.',
  styleData: {
    tone: 'friendly',
    sentence_length: 'short',
    greeting_style: 'informal',
  },
  formalityMap: {
    'kovacs.anna@gmail.com': { formality: 'informal', confidence: 0.95 },
    'igazgato@iskola.hu': { formality: 'formal', confidence: 0.88 },
    'szuloi.munkakozseg@gmail.com': { formality: 'mixed', confidence: 0.62 },
  },
  analyzedEmailCount: 156,
  draftApprovedCount: 42,
  draftEditedCount: 8,
  draftRejectedCount: 3,
  approvalRate: 79.2,
  lastBuiltAt: '2026-03-18T14:30:00.000Z',
  lastRefinedAt: '2026-03-20T09:15:00.000Z',
};

class MockEmailHubService {
  getVoiceProfile() {
    return of(MOCK_VOICE_PROFILE);
  }
  rebuildVoiceProfile() {
    return of({ status: 'rebuilding' });
  }
}

const meta: Meta<EmailHubVoiceProfileComponent> = {
  title: 'Partner/EmailHub/VoiceProfile',
  component: EmailHubVoiceProfileComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: EmailHubService, useClass: MockEmailHubService },
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
type Story = StoryObj<EmailHubVoiceProfileComponent>;

/** Alapertelmezett - Hangprofil adatokkal */
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
