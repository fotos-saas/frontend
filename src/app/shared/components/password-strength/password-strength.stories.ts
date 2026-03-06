import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, Check, X } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PasswordStrengthComponent } from './password-strength.component';

const meta: Meta<PasswordStrengthComponent> = {
  title: 'Shared/UI/PasswordStrength',
  component: PasswordStrengthComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        PasswordStrengthComponent,
        LucideAngularModule.pick({ Check, X }),
        MatTooltipModule,
      ],
    }),
  ],
  argTypes: {
    password: {
      control: 'text',
      description: 'Jelszó szöveg',
    },
    compact: {
      control: 'boolean',
      description: 'Kompakt megjelenés',
    },
  },
};

export default meta;
type Story = StoryObj<PasswordStrengthComponent>;

/** Üres jelszó */
export const Default: Story = {
  args: {
    password: '',
    compact: false,
  },
};

/** Gyenge jelszó */
export const Weak: Story = {
  args: {
    password: 'abc',
    compact: false,
  },
};

/** Közepes jelszó */
export const Fair: Story = {
  args: {
    password: 'Abc12',
    compact: false,
  },
};

/** Jó jelszó */
export const Good: Story = {
  args: {
    password: 'Abc12345',
    compact: false,
  },
};

/** Erős jelszó */
export const Strong: Story = {
  args: {
    password: 'Abc12345!@#',
    compact: false,
  },
};

/** Kompakt megjelenés */
export const Compact: Story = {
  args: {
    password: 'Abc12345!@#',
    compact: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    password: 'Abc123',
    compact: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
