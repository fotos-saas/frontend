import { Meta, StoryObj } from '@storybook/angular';
import { ScheduleReminderDialogComponent } from './schedule-reminder-dialog.component';

/**
 * ## Schedule Reminder Dialog
 *
 * Emlékeztető dialógus a fotózás időpontjának megadásához.
 *
 * ### Jellemzők:
 * - Dátumválasztó a fotózás időpontjához
 * - Halasztás (7 vagy 21 nap)
 * - Mentés gomb a kiválasztott dátummal
 * - DialogWrapperComponent shell
 *
 * ### Eredmény típusok:
 * - `save` - Dátum mentése
 * - `snooze` - Halasztás megadott napra
 * - `close` - X gomb / ESC
 * - `backdrop` - Backdrop kattintás
 */
const meta: Meta<ScheduleReminderDialogComponent> = {
  title: 'Shared/Dialogs/ScheduleReminderDialog',
  component: ScheduleReminderDialogComponent,
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
type Story = StoryObj<ScheduleReminderDialogComponent>;

/**
 * Alapértelmezett állapot - üres dátumválasztó
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Az emlékeztető dialógus alapállapota, üres dátumválasztóval.',
      },
    },
  },
};
