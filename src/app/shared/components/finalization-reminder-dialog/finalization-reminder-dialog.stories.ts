import { Meta, StoryObj } from '@storybook/angular';
import { FinalizationReminderDialogComponent } from './finalization-reminder-dialog.component';

/**
 * ## Finalization Reminder Dialog
 *
 * Emlékeztető dialógus a tervkészítés véglegesítéséhez.
 *
 * ### Jellemzők:
 * - Navigálás a véglegesítés oldalra
 * - Halasztás (7 vagy 14 nap)
 * - Bezárás (cooldown aktív) és backdrop (nincs cooldown)
 * - DialogWrapperComponent shell
 *
 * ### Eredmény típusok:
 * - `navigate` - Navigálás a véglegesítés oldalra
 * - `snooze` - Halasztás megadott napra
 * - `close` - X gomb / ESC (cooldown aktív)
 * - `backdrop` - Backdrop kattintás (nincs cooldown)
 */
const meta: Meta<FinalizationReminderDialogComponent> = {
  title: 'Shared/Dialogs/FinalizationReminderDialog',
  component: FinalizationReminderDialogComponent,
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
type Story = StoryObj<FinalizationReminderDialogComponent>;

/**
 * Alapértelmezett állapot
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Az emlékeztető dialógus alapállapota a véglegesítés sürgetéséhez.',
      },
    },
  },
};
