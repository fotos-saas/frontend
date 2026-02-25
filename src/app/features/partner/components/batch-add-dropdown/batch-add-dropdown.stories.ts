import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  LucideAngularModule,
  ShoppingCart,
} from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BatchAddDropdownComponent } from './batch-add-dropdown.component';
import type { PartnerProjectListItem } from '../../models/partner.models';

const mockProject: Partial<PartnerProjectListItem> = {
  id: 1,
  name: 'Hunyadi János Általános Iskola',
  schoolName: 'Hunyadi János Ált. Isk.',
  className: '12.A',
  personsCount: 28,
  sampleThumbUrl: null,
};

const meta: Meta<BatchAddDropdownComponent> = {
  title: 'Partner/Batch/AddDropdown',
  component: BatchAddDropdownComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({ ShoppingCart }),
        MatTooltipModule,
      ],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
  args: {
    project: mockProject as PartnerProjectListItem,
  },
};

export default meta;
type Story = StoryObj<BatchAddDropdownComponent>;

/** Default - Alapértelmezett gomb */
export const Default: Story = {};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 40px; background: #1e293b; border-radius: 12px;">
        <app-batch-add-dropdown [project]="project" />
      </div>
    `,
    props: { project: mockProject },
  }),
};
