import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { GuestBadgeComponent } from './guest-badge.component';

const meta: Meta<GuestBadgeComponent> = {
  title: 'Shared/Navbar/GuestBadge',
  component: GuestBadgeComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [GuestBadgeComponent],
    }),
  ],
};

export default meta;
type Story = StoryObj<GuestBadgeComponent>;

/** Alapértelmezett - statikus "Vendég" badge */
export const Default: Story = {};
