import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  LucideAngularModule,
  ShoppingCart, X, Play, Trash2,
} from 'lucide-angular';
import { BatchCartViewComponent } from './batch-cart-view.component';

const meta: Meta<BatchCartViewComponent> = {
  title: 'Partner/Batch/CartView',
  component: BatchCartViewComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({ ShoppingCart, X, Play, Trash2 }),
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
type Story = StoryObj<BatchCartViewComponent>;

/** Default - Üres kosár */
export const Default: Story = {};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="width: 400px; padding: 0; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
        <app-batch-cart-view />
      </div>
    `,
  }),
};
