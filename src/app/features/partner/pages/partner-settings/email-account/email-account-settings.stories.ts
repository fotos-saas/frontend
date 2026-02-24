import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { importProvidersFrom } from '@angular/core';
import {
  LucideAngularModule,
  Mail, Send, Inbox, Save, Zap, Trash2,
  CheckCircle, XCircle, AlertCircle, AlertTriangle,
} from 'lucide-angular';
import { EmailAccountSettingsComponent } from './email-account-settings.component';

const meta: Meta<EmailAccountSettingsComponent> = {
  title: 'Partner/Settings/EmailAccount',
  component: EmailAccountSettingsComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideAnimationsAsync(),
        importProvidersFrom(
          LucideAngularModule.pick({
            Mail, Send, Inbox, Save, Zap, Trash2,
            CheckCircle, XCircle, AlertCircle, AlertTriangle,
          }),
        ),
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<EmailAccountSettingsComponent>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (storyFn) => {
      document.body.classList.add('dark');
      const story = storyFn();
      return story;
    },
  ],
};
