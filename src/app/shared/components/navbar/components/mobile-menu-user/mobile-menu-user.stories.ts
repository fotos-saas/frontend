import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { MobileMenuUserComponent } from './mobile-menu-user.component';

const meta: Meta<MobileMenuUserComponent> = {
  title: 'Shared/Navbar/MobileMenuUser',
  component: MobileMenuUserComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [MobileMenuUserComponent],
    }),
  ],
  argTypes: {
    displayName: { control: 'text', description: 'Megjelenített név' },
    mode: {
      control: 'select',
      options: ['guest', 'contact'],
      description: 'Megjelenítési mód',
    },
  },
};

export default meta;
type Story = StoryObj<MobileMenuUserComponent>;

/** Alapértelmezett - vendég mód */
export const Default: Story = {
  args: {
    displayName: 'Kiss Anna',
    mode: 'guest',
  },
};

/** Kapcsolattartó mód */
export const KapcsolattartoMod: Story = {
  args: {
    displayName: 'Nagy Péter',
    mode: 'contact',
  },
};

/** Név nélkül */
export const NevNelkul: Story = {
  args: {
    displayName: null,
    mode: 'guest',
  },
};

/** Hosszú név */
export const HosszuNev: Story = {
  args: {
    displayName: 'Dr. Nagyházi-Tóthné Szabó Mária Erzsébet',
    mode: 'contact',
  },
};
