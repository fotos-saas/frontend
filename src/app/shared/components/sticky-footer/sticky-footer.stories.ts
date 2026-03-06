import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, Save, CheckCircle } from 'lucide-angular';
import { StickyFooterComponent } from './sticky-footer.component';

const meta: Meta<StickyFooterComponent> = {
  title: 'Shared/UI/StickyFooter',
  component: StickyFooterComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        StickyFooterComponent,
        LucideAngularModule.pick({ Save, CheckCircle }),
      ],
    }),
  ],
  argTypes: {
    withSidebar: {
      control: 'boolean',
      description: 'Sidebar figyelembevétele',
    },
    isSaving: {
      control: 'boolean',
      description: 'Mentés folyamatban',
    },
    primaryLabel: {
      control: 'text',
      description: 'Elsődleges gomb szöveg',
    },
    primaryDisabled: {
      control: 'boolean',
      description: 'Elsődleges gomb letiltva',
    },
    showSecondaryButton: {
      control: 'boolean',
      description: 'Másodlagos gomb megjelenítése',
    },
    secondaryLabel: {
      control: 'text',
      description: 'Másodlagos gomb szöveg',
    },
    secondaryDisabled: {
      control: 'boolean',
      description: 'Másodlagos gomb letiltva',
    },
  },
};

export default meta;
type Story = StoryObj<StickyFooterComponent>;

/** Alapértelmezett - két gomb */
export const Default: Story = {
  args: {
    primaryLabel: 'Véglegesítés',
    secondaryLabel: 'Mentés',
    showSecondaryButton: true,
    isSaving: false,
    primaryDisabled: false,
    secondaryDisabled: false,
    withSidebar: false,
  },
};

/** Csak elsődleges gomb */
export const PrimaryOnly: Story = {
  args: {
    primaryLabel: 'Véglegesítés',
    showSecondaryButton: false,
    isSaving: false,
    primaryDisabled: false,
    withSidebar: false,
  },
};

/** Mentés folyamatban */
export const Saving: Story = {
  args: {
    primaryLabel: 'Véglegesítés',
    secondaryLabel: 'Mentés',
    showSecondaryButton: true,
    isSaving: true,
    primaryDisabled: false,
    secondaryDisabled: false,
    withSidebar: false,
  },
};

/** Elsődleges gomb letiltva */
export const PrimaryDisabled: Story = {
  args: {
    primaryLabel: 'Véglegesítés',
    secondaryLabel: 'Mentés',
    showSecondaryButton: true,
    isSaving: false,
    primaryDisabled: true,
    secondaryDisabled: false,
    withSidebar: false,
  },
};

/** Sidebar melletti megjelenés */
export const WithSidebar: Story = {
  args: {
    primaryLabel: 'Véglegesítés',
    secondaryLabel: 'Mentés',
    showSecondaryButton: true,
    isSaving: false,
    primaryDisabled: false,
    secondaryDisabled: false,
    withSidebar: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    primaryLabel: 'Véglegesítés',
    secondaryLabel: 'Mentés',
    showSecondaryButton: true,
    isSaving: false,
    primaryDisabled: false,
    secondaryDisabled: false,
    withSidebar: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
