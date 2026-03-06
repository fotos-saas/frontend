import { Meta, StoryObj } from '@storybook/angular';
import { ConfirmDialogComponent } from './confirm-dialog.component';

/**
 * ## Confirm Dialog
 *
 * Újrafelhasználható megerősítő dialógus törlésekhez és veszélyes műveletekhez.
 *
 * ### Jellemzők:
 * - **3 típus:** danger (piros), warning (sárga), primary (kék)
 * - Dinamikus ikon és téma a típus alapján
 * - Mégse és megerősítés gombok
 * - isSubmitting állapot támogatás
 * - DialogWrapperComponent-en alapul
 */
const meta: Meta<ConfirmDialogComponent> = {
  title: 'Shared/Dialogs/ConfirmDialog',
  component: ConfirmDialogComponent,
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
type Story = StoryObj<ConfirmDialogComponent>;

/**
 * Alapértelmezett állapot - törlés megerősítése (danger)
 */
export const Default: Story = {
  args: {
    title: 'Megerősítés',
    message: 'Biztosan folytatod?',
    confirmText: 'Törlés',
    cancelText: 'Mégse',
    confirmType: 'danger',
    isSubmitting: false,
    showCancel: true,
  },
};

/**
 * Veszélyes művelet (danger) - piros téma
 */
export const Danger: Story = {
  args: {
    title: 'Elem törlése',
    message: 'Biztosan törölni szeretnéd ezt az elemet? Ez a művelet nem vonható vissza.',
    confirmText: 'Végleges törlés',
    cancelText: 'Mégse',
    confirmType: 'danger',
  },
};

/**
 * Figyelmeztetés (warning) - sárga/amber téma
 */
export const Warning: Story = {
  args: {
    title: 'Módosítások elvetése',
    message: 'Nem mentett módosításaid vannak. Biztosan elveted őket?',
    confirmText: 'Elvetés',
    cancelText: 'Maradok',
    confirmType: 'warning',
  },
};

/**
 * Elsődleges művelet (primary) - kék téma
 */
export const Primary: Story = {
  args: {
    title: 'Megerősítés szükséges',
    message: 'Biztosan végrehajtod ezt a műveletet?',
    confirmText: 'Igen, végrehajtom',
    cancelText: 'Mégsem',
    confirmType: 'primary',
  },
};

/**
 * Betöltés állapot - isSubmitting
 */
export const Submitting: Story = {
  args: {
    title: 'Törlés folyamatban',
    message: 'Az elem törlése folyamatban van...',
    confirmText: 'Törlés',
    confirmType: 'danger',
    isSubmitting: true,
  },
};

/**
 * Mégse gomb nélkül
 */
export const WithoutCancel: Story = {
  args: {
    title: 'Információ',
    message: 'Ez egy tájékoztató üzenet. Kattints a gombra a folytatáshoz.',
    confirmText: 'Rendben',
    confirmType: 'primary',
    showCancel: false,
  },
};

/**
 * Hosszú szöveg
 */
export const LongMessage: Story = {
  args: {
    title: 'Projekt törlése',
    message:
      'Biztosan törölni szeretnéd a "2024-es Érettségi Tabló" projektet? ' +
      'Ez a művelet véglegesen törli az összes kapcsolódó fotót, szavazatot és beállítást. ' +
      'A törlés nem vonható vissza!',
    confirmText: 'Projekt törlése',
    cancelText: 'Mégse',
    confirmType: 'danger',
  },
};
