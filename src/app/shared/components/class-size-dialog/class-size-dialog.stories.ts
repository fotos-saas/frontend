import { Meta, StoryObj } from '@storybook/angular';
import { ClassSizeDialogComponent } from './class-size-dialog.component';

/**
 * ## Class Size Dialog
 *
 * Osztálylétszám bekérés popup.
 *
 * ### Jellemzők:
 * - Szám beviteli mező (5-500 közötti egész szám)
 * - Validáció központi validatorral
 * - Mégse és mentés gombok
 * - isSubmitting állapot támogatás
 * - DialogWrapperComponent shell
 */
const meta: Meta<ClassSizeDialogComponent> = {
  title: 'Shared/Dialogs/ClassSizeDialog',
  component: ClassSizeDialogComponent,
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
type Story = StoryObj<ClassSizeDialogComponent>;

/**
 * Alapértelmezett állapot - üres mező
 */
export const Default: Story = {
  args: {
    isSubmitting: false,
    errorMessage: null,
    currentValue: null,
  },
};

/**
 * Előre kitöltött értékkel (szerkesztés)
 */
export const WithCurrentValue: Story = {
  args: {
    currentValue: 28,
    isSubmitting: false,
    errorMessage: null,
  },
};

/**
 * Betöltés állapot
 */
export const Submitting: Story = {
  args: {
    currentValue: 32,
    isSubmitting: true,
    errorMessage: null,
  },
};

/**
 * Hibaüzenet megjelenítése
 */
export const WithError: Story = {
  args: {
    currentValue: 28,
    isSubmitting: false,
    errorMessage: 'Hiba történt a létszám mentése során.',
  },
};
