import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PasswordSetDialogComponent } from './password-set-dialog.component';
import { FormsModule } from '@angular/forms';
import { PasswordStrengthComponent } from '../password-strength/password-strength.component';
import { HttpClientModule } from '@angular/common/http';

/**
 * ## Password Set Dialog
 *
 * Jelszó beállító dialog QR regisztráció után.
 *
 * ### Fontos jellemzők:
 * - **NEM ZÁRHATÓ**: Nincs X gomb, ESC nem működik, backdrop kattintás nem zár
 * - Purple/lila téma (biztonsági jelleg)
 * - Jelszó erősség indikátor
 * - Jelszó megjelenítés/elrejtés toggle
 * - Jelszó megerősítés egyezés jelzés
 *
 * ### Használat:
 * Csak az AppShell-ben használjuk globálisan, ha a user passwordSet flag-je false.
 */
const meta: Meta<PasswordSetDialogComponent> = {
  title: 'Shared/Dialogs/PasswordSetDialog',
  component: PasswordSetDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [
        FormsModule,
        PasswordStrengthComponent,
        HttpClientModule,
  ]
    })
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#1e293b' }
      ]
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<PasswordSetDialogComponent>;

/**
 * Alapértelmezett állapot - üres form
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'A dialog alapállapota üres beviteli mezőkkel.'
      }
    }
  }
};

/**
 * Gyenge jelszó állapot
 */
export const WeakPassword: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const passwordInput = canvasElement.querySelector('#password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.value = 'abc';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Gyenge jelszó esetén a strength indikátor piros és "Gyenge" felirat jelenik meg.'
      }
    }
  }
};

/**
 * Erős jelszó állapot
 */
export const StrongPassword: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const passwordInput = canvasElement.querySelector('#password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.value = 'SecureP@ss123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Erős jelszó esetén a strength indikátor zöld és "Erős" felirat jelenik meg.'
      }
    }
  }
};

/**
 * Jelszó megerősítés egyezés
 */
export const MatchingPasswords: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const passwordInput = canvasElement.querySelector('#password') as HTMLInputElement;
    const confirmInput = canvasElement.querySelector('#password-confirmation') as HTMLInputElement;
    if (passwordInput && confirmInput) {
      passwordInput.value = 'SecureP@ss123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      confirmInput.value = 'SecureP@ss123!';
      confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Ha a két jelszó egyezik, zöld "A jelszavak megegyeznek" üzenet jelenik meg.'
      }
    }
  }
};

/**
 * Nem egyező jelszavak
 */
export const MismatchedPasswords: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const passwordInput = canvasElement.querySelector('#password') as HTMLInputElement;
    const confirmInput = canvasElement.querySelector('#password-confirmation') as HTMLInputElement;
    if (passwordInput && confirmInput) {
      passwordInput.value = 'SecureP@ss123!';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      confirmInput.value = 'DifferentP@ss';
      confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Ha a jelszavak nem egyeznek, a form nem küldhető el (gomb disabled).'
      }
    }
  }
};

/**
 * Mobil nézet
 */
export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobil nézetben a dialog szélességhez igazodik és a betűméretek kisebbek.'
      }
    }
  }
};

/**
 * A11y (Reduced motion)
 */
export const ReducedMotion: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'prefers-reduced-motion média query esetén az animációk le vannak tiltva.'
      }
    }
  }
};
