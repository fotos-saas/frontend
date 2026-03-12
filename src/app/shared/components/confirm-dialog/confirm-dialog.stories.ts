import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * ## Confirm Dialog
 *
 * Ujrafelhasznalhato megerosito dialogus.
 *
 * ### Jellemzok:
 * - 3 tipus: danger (torles), warning (figyelmeztetes), primary (informacio)
 * - Dinamikus tema es ikon a confirmType alapjan
 * - Megse + Megerosites gombok
 * - Submitting allapot tamogatas
 * - DialogWrapper-re epul (hero header)
 */
const meta: Meta<ConfirmDialogComponent> = {
  title: 'Shared/Dialogs/ConfirmDialog',
  component: ConfirmDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ConfirmDialogComponent,
        DialogWrapperComponent,
        LucideAngularModule,
        A11yModule,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Dialog cime',
    },
    message: {
      control: 'text',
      description: 'Megerosito uzenet',
    },
    confirmText: {
      control: 'text',
      description: 'Megerosito gomb szovege',
    },
    cancelText: {
      control: 'text',
      description: 'Megse gomb szovege',
    },
    confirmType: {
      control: 'select',
      options: ['danger', 'warning', 'primary'],
      description: 'Megerosites tipusa (szin + ikon)',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Kuldes folyamatban',
    },
    showCancel: {
      control: 'boolean',
      description: 'Megse gomb megjelenitese',
    },
  },
};

export default meta;
type Story = StoryObj<ConfirmDialogComponent>;

// ============================================================================
// ALAP VARIANSOK
// ============================================================================

/**
 * Default - Torles megerosites (danger)
 */
export const Default: Story = {
  args: {
    title: 'Projekt torlese',
    message: 'Biztosan torolni szeretned ezt a projektet? Ez a muvelet nem vonhato vissza.',
    confirmText: 'Torles',
    cancelText: 'Megse',
    confirmType: 'danger',
    isSubmitting: false,
    showCancel: true,
  },
};

/**
 * Warning - Figyelmezteto dialog
 */
export const Warning: Story = {
  args: {
    title: 'Modositasok elvesznek',
    message: 'Nem mentett modositasaid vannak. Biztosan el szeretned hagyni az oldalt?',
    confirmText: 'Elhagy',
    cancelText: 'Maradok',
    confirmType: 'warning',
    isSubmitting: false,
    showCancel: true,
  },
};

/**
 * Info - Informacios megerosites (primary)
 */
export const Info: Story = {
  args: {
    title: 'Veglegesites',
    message: 'Veglegesited a kivalasztast? A kepek a fotoshoz kerulnek feldolgozasra.',
    confirmText: 'Veglegesites',
    cancelText: 'Megse',
    confirmType: 'primary',
    isSubmitting: false,
    showCancel: true,
  },
};

// ============================================================================
// ALLAPOTOK
// ============================================================================

/**
 * Submitting - Kuldes folyamatban
 */
export const Submitting: Story = {
  args: {
    title: 'Projekt torlese',
    message: 'Biztosan torolni szeretned ezt a projektet?',
    confirmText: 'Torles...',
    cancelText: 'Megse',
    confirmType: 'danger',
    isSubmitting: true,
    showCancel: true,
  },
};

/**
 * Megse gomb nelkul - Csak megerosites lehetseges
 */
export const WithoutCancel: Story = {
  args: {
    title: 'Fontos ertesites',
    message: 'A rendszer karbantartas alatt lesz holnap 6:00 es 8:00 kozott.',
    confirmText: 'Ertem',
    confirmType: 'primary',
    isSubmitting: false,
    showCancel: false,
  },
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/**
 * DarkMode - Sotet hatter
 */
export const DarkMode: Story = {
  args: {
    title: 'Fajl torlese',
    message: 'Biztosan torolni szeretned a kivalasztott fajlokat?',
    confirmText: 'Torles',
    cancelText: 'Megse',
    confirmType: 'danger',
    isSubmitting: false,
    showCancel: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/**
 * A11y - Akadalymentesseg
 */
export const A11y: Story = {
  args: {
    title: 'Megerosites szukseges',
    message: 'A dialog ARIA role, aria-modal es aria-labelledby attributumokkal rendelkezik. ESC billentyuvel bezarhato.',
    confirmText: 'Megerosites',
    cancelText: 'Megse',
    confirmType: 'primary',
    isSubmitting: false,
    showCancel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Akadalymentes dialog: ARIA attributumok, billentyuzet navigacio (ESC bezar, Enter megerosit), focus trap.',
      },
    },
  },
};
