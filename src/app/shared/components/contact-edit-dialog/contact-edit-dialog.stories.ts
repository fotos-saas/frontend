import { Meta, StoryObj } from '@storybook/angular';
import { ContactEditDialogComponent } from './contact-edit-dialog.component';

/**
 * ## Contact Edit Dialog
 *
 * Kapcsolattartó adatok szerkesztése dialógusban.
 *
 * ### Jellemzők:
 * - Név, email, telefonszám mezők
 * - Validáció (kötelező mezők, email formátum, telefon formátum)
 * - Mentés és mégse gombok
 * - isSaving állapot támogatás
 * - DialogWrapperComponent shell
 */
const meta: Meta<ContactEditDialogComponent> = {
  title: 'Shared/Dialogs/ContactEditDialog',
  component: ContactEditDialogComponent,
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
type Story = StoryObj<ContactEditDialogComponent>;

/**
 * Alapértelmezett állapot - üres form
 */
export const Default: Story = {
  args: {
    initialData: { name: '', email: '', phone: '' },
    isSaving: false,
  },
};

/**
 * Meglévő adatokkal - szerkesztés
 */
export const WithExistingData: Story = {
  args: {
    initialData: {
      name: 'Kiss Péter',
      email: 'kiss.peter@iskola.hu',
      phone: '+36 30 123 4567',
    },
    isSaving: false,
  },
};

/**
 * Mentés folyamatban
 */
export const Saving: Story = {
  args: {
    initialData: {
      name: 'Nagy Anna',
      email: 'nagy.anna@iskola.hu',
      phone: '+36 20 987 6543',
    },
    isSaving: true,
  },
};
