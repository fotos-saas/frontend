import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { UpdateBannerComponent } from './update-banner.component';
import { VersionCheckService } from '../../../core/services/version-check.service';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS_MAP } from '../../constants/lucide-icons';

const mockVersionCheckService = {
  updateAvailable: signal(true),
  currentHash: signal('abc12345'),
  latestHash: signal('def67890'),
  reloadPage: () => {
    // eslint-disable-next-line no-console
    console.log('[Story] reloadPage() meghívva');
  },
  startPolling: () => {},
  stopPolling: () => {},
};

const meta: Meta<UpdateBannerComponent> = {
  title: 'Shared/UpdateBanner',
  component: UpdateBannerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        UpdateBannerComponent,
        LucideAngularModule.pick(LUCIDE_ICONS_MAP),
      ],
      providers: [
        { provide: VersionCheckService, useValue: mockVersionCheckService },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<UpdateBannerComponent>;

/**
 * Default - banner megjelenik (új verzió elérhető)
 */
export const Default: Story = {};

/**
 * DarkMode - sötét háttéren
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story: () => { template?: string; props?: Record<string, unknown> }) => ({
      template: `<div style="padding: 20px; background: #1e293b; min-height: 200px;">${story().template || '<app-update-banner />'}</div>`,
      props: story().props,
    }),
  ],
};

/**
 * A11y - akadálymentességi teszt
 */
export const A11y: Story = {
  parameters: {
    a11y: { disable: false },
  },
};
