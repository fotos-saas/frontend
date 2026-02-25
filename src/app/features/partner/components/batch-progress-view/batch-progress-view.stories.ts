import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  LucideAngularModule,
  Loader2, Play, Pause, Square, Trash2,
  CheckCircle, XCircle, MinusCircle, Clock, RotateCcw,
} from 'lucide-angular';
import { BatchProgressViewComponent } from './batch-progress-view.component';

const meta: Meta<BatchProgressViewComponent> = {
  title: 'Partner/Batch/ProgressView',
  component: BatchProgressViewComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({
          Loader2, Play, Pause, Square, Trash2,
          CheckCircle, XCircle, MinusCircle, Clock, RotateCcw,
        }),
      ],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj<BatchProgressViewComponent>;

/** Default - Idle állapot (nincs job) */
export const Default: Story = {};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="width: 400px; padding: 0; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
        <app-batch-progress-view />
      </div>
    `,
  }),
};
