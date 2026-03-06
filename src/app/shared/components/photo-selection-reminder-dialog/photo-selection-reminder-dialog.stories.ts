import { Meta, StoryObj } from '@storybook/angular';
import { PhotoSelectionReminderDialogComponent } from './photo-selection-reminder-dialog.component';

/**
 * ## Photo Selection Reminder Dialog
 *
 * Emlékeztető dialógus a képválasztáshoz.
 *
 * ### Jellemzők:
 * - Lépésenként más üzenet (claiming, retouch, tablo)
 * - 12 órára elhalasztható
 * - Navigálás a képválasztás oldalra
 * - DialogWrapperComponent shell
 *
 * ### Lépések:
 * - **claiming**: "Hahó! Ess neki a képválasztásnak!"
 * - **retouch**: "Ne felejtsd el a retusálást!"
 * - **tablo**: "Válaszd ki a tablóképed!"
 */
const meta: Meta<PhotoSelectionReminderDialogComponent> = {
  title: 'Shared/Dialogs/PhotoSelectionReminderDialog',
  component: PhotoSelectionReminderDialogComponent,
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
type Story = StoryObj<PhotoSelectionReminderDialogComponent>;

/**
 * Alapértelmezett - claiming lépés
 */
export const Default: Story = {
  args: {
    currentStep: 'claiming',
  },
};

/**
 * Claiming lépés - képválasztás kezdése
 */
export const ClaimingStep: Story = {
  args: {
    currentStep: 'claiming',
  },
  parameters: {
    docs: {
      description: {
        story: 'Az első lépés: a felhasználó még nem kezdte el a képválasztást.',
      },
    },
  },
};

/**
 * Retouch lépés - retusálás emlékeztető
 */
export const RetouchStep: Story = {
  args: {
    currentStep: 'retouch',
  },
  parameters: {
    docs: {
      description: {
        story: 'A második lépés: a felhasználó a retusálási fázisban van.',
      },
    },
  },
};

/**
 * Tablo lépés - tablókép választás
 */
export const TabloStep: Story = {
  args: {
    currentStep: 'tablo',
  },
  parameters: {
    docs: {
      description: {
        story: 'A harmadik lépés: a felhasználó a tablókép kiválasztásánál tart.',
      },
    },
  },
};
