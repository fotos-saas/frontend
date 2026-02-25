import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  LucideAngularModule,
  ShoppingCart, X, Loader2, Play, Trash2,
  CheckCircle, XCircle, MinusCircle, Clock, Pause, Square, RotateCcw,
} from 'lucide-angular';
import { BatchWorkspacePanelComponent } from './batch-workspace-panel.component';

const meta: Meta<BatchWorkspacePanelComponent> = {
  title: 'Partner/Batch/WorkspacePanel',
  component: BatchWorkspacePanelComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({
          ShoppingCart, X, Loader2, Play, Trash2,
          CheckCircle, XCircle, MinusCircle, Clock, Pause, Square, RotateCcw,
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
type Story = StoryObj<BatchWorkspacePanelComponent>;

/** Default - Üres kosár, FAB gomb */
export const Default: Story = {};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 40px; background: #1e293b; min-height: 200px; border-radius: 12px;">
        <app-batch-workspace-panel />
      </div>
    `,
  }),
};
