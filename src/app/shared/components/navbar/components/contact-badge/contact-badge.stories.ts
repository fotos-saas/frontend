import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ContactBadgeComponent } from './contact-badge.component';

const meta: Meta<ContactBadgeComponent> = {
  title: 'Shared/Navbar/ContactBadge',
  component: ContactBadgeComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ContactBadgeComponent],
    }),
  ],
  argTypes: {
    contactName: { control: 'text', description: 'Kapcsolattartó neve' },
  },
};

export default meta;
type Story = StoryObj<ContactBadgeComponent>;

/** Alapértelmezett - névvel */
export const Default: Story = {
  args: {
    contactName: 'Kovács Anna',
  },
};

/** Hosszú név */
export const HosszuNev: Story = {
  args: {
    contactName: 'Dr. Nagyházi-Tóthné Szabó Mária Erzsébet',
  },
};

/** Név nélkül */
export const NevNelkul: Story = {
  args: {
    contactName: null,
  },
};
