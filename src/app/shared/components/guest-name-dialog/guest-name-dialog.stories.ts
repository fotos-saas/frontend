import { Meta, StoryObj } from '@storybook/angular';
import { GuestNameDialogComponent } from './guest-name-dialog.component';

/**
 * ## Guest Name Dialog
 *
 * Vendég névbekérés popup.
 *
 * ### Két mód:
 * - **register**: Első belépéskor, kötelező kitölteni (zöld téma)
 * - **edit**: Meglévő adatok szerkesztése (kék téma)
 *
 * ### Jellemzők:
 * - Név és email mező
 * - Validáció (min 2 karakter, max 100)
 * - Dinamikus cím, leírás, ikon a mód alapján
 * - DialogWrapperComponent shell
 */
const meta: Meta<GuestNameDialogComponent> = {
  title: 'Shared/Dialogs/GuestNameDialog',
  component: GuestNameDialogComponent,
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
};

export default meta;
type Story = StoryObj<GuestNameDialogComponent>;

/**
 * Alapértelmezett állapot - regisztráció mód (zöld téma)
 */
export const Default: Story = {
  args: {
    mode: 'register',
    initialName: '',
    initialEmail: '',
    isSubmitting: false,
    errorMessage: null,
    canClose: false,
  },
};

/**
 * Regisztráció mód - üres form
 */
export const RegisterMode: Story = {
  args: {
    mode: 'register',
    initialName: '',
    initialEmail: '',
    canClose: false,
  },
};

/**
 * Szerkesztés mód - meglévő adatokkal (kék téma)
 */
export const EditMode: Story = {
  args: {
    mode: 'edit',
    initialName: 'Kiss Péter',
    initialEmail: 'kiss.peter@email.hu',
    canClose: true,
  },
};

/**
 * Betöltés állapot
 */
export const Submitting: Story = {
  args: {
    mode: 'register',
    initialName: 'Nagy Anna',
    isSubmitting: true,
  },
};

/**
 * Hibaüzenet megjelenítése
 */
export const WithError: Story = {
  args: {
    mode: 'register',
    initialName: 'Teszt',
    errorMessage: 'Ez a név már foglalt. Kérlek, válassz másikat.',
  },
};

/**
 * Bezárható dialógus (edit módban)
 */
export const Closable: Story = {
  args: {
    mode: 'edit',
    initialName: 'Szabó Kata',
    initialEmail: 'szabo.kata@email.hu',
    canClose: true,
  },
};
