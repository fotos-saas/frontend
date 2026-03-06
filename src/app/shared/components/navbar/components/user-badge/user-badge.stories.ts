import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { UserBadgeComponent } from './user-badge.component';

const meta: Meta<UserBadgeComponent> = {
  title: 'Shared/Navbar/UserBadge',
  component: UserBadgeComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [UserBadgeComponent],
    }),
  ],
  argTypes: {
    displayName: { control: 'text', description: 'Megjelenített név' },
  },
};

export default meta;
type Story = StoryObj<UserBadgeComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    displayName: 'Kiss Béla',
  },
};

/** Hosszú név */
export const HosszuNev: Story = {
  args: {
    displayName: 'Nagyházi-Tóthné Szabó Mária',
  },
};

/** Név nélkül */
export const NevNelkul: Story = {
  args: {
    displayName: null,
  },
};
