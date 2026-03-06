import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { DialogWrapperComponent } from './dialog-wrapper.component';

/**
 * ## Dialog Wrapper
 *
 * Általános dialógus keret komponens, amelyet az alkalmazás összes dialógusa használ.
 *
 * ### Jellemzők:
 * - **3 header stílus:** hero (gradient + nagy ikon), flat (border-bottom + kis ikon), minimal (csak cím)
 * - **3 méret:** sm (384px), md (480px), lg (800px)
 * - **5 téma:** purple, green, blue, red, amber
 * - **Slotok:** dialogBody, dialogFooter
 * - **ESC** és **Enter** billentyű kezelés
 * - **Backdrop** kattintás kezelés
 * - **Body scroll lock** (Safari kompatibilis)
 * - **Focus trap** a dialóguson belül
 */

// Wrapper component a slotolt tartalom megjelenítéséhez
@Component({
  selector: 'storybook-dialog-wrapper-host',
  standalone: true,
  imports: [DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      [headerStyle]="headerStyle()"
      [theme]="theme()"
      [title]="title()"
      [description]="description()"
      [size]="size()"
      [closable]="closable()"
      [isSubmitting]="isSubmitting()"
      [errorMessage]="errorMessage()"
      (closeEvent)="onClose()"
      (submitEvent)="onSubmit()"
    >
      <div dialogBody>
        <p style="color: #475569; line-height: 1.6;">
          Ez egy példa dialógus tartalma. Ide kerül a form vagy egyéb tartalom.
        </p>
      </div>
      <div dialogFooter>
        <button
          style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #475569;"
        >
          Mégse
        </button>
        <button
          style="padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer;"
        >
          Mentés
        </button>
      </div>
    </app-dialog-wrapper>
  `,
})
class DialogWrapperHostComponent {
  readonly headerStyle = input<'hero' | 'flat' | 'minimal'>('flat');
  readonly theme = input<'purple' | 'blue' | 'green' | 'red' | 'amber'>('blue');
  readonly title = input<string>('Dialógus cím');
  readonly description = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closable = input<boolean>(true);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  onClose(): void {}
  onSubmit(): void {}
}

const meta: Meta<DialogWrapperHostComponent> = {
  title: 'Shared/Dialogs/DialogWrapper',
  component: DialogWrapperHostComponent,
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
type Story = StoryObj<DialogWrapperHostComponent>;

/**
 * Alapértelmezett állapot - flat header, blue téma, md méret
 */
export const Default: Story = {
  args: {
    headerStyle: 'flat',
    theme: 'blue',
    title: 'Dialógus cím',
    description: 'Ez egy leírás a dialógus tartalmáról.',
    size: 'md',
    closable: true,
    isSubmitting: false,
    errorMessage: null,
  },
};

/**
 * Hero header stílus - gradient háttér, nagy ikon
 */
export const HeroHeader: Story = {
  args: {
    headerStyle: 'hero',
    theme: 'purple',
    title: 'Új elem létrehozása',
    description: 'Töltsd ki az alábbi mezőket az új elem hozzáadásához.',
    size: 'md',
  },
};

/**
 * Minimal header stílus - csak cím, X gomb
 */
export const MinimalHeader: Story = {
  args: {
    headerStyle: 'minimal',
    theme: 'blue',
    title: 'Egyszerű dialógus',
    size: 'sm',
  },
};

/**
 * Kis méret (sm - 384px)
 */
export const SmallSize: Story = {
  args: {
    headerStyle: 'flat',
    theme: 'green',
    title: 'Kis dialógus',
    description: 'Ez egy kis méretű dialógus.',
    size: 'sm',
  },
};

/**
 * Nagy méret (lg - 800px)
 */
export const LargeSize: Story = {
  args: {
    headerStyle: 'flat',
    theme: 'blue',
    title: 'Nagy dialógus',
    description: 'Ez egy nagy méretű dialógus.',
    size: 'lg',
  },
};

/**
 * Piros téma - törlés/veszélyes műveletek
 */
export const RedTheme: Story = {
  args: {
    headerStyle: 'hero',
    theme: 'red',
    title: 'Törlés megerősítése',
    description: 'Biztosan törölni szeretnéd?',
    size: 'sm',
  },
};

/**
 * Amber/sárga téma - figyelmeztetés
 */
export const AmberTheme: Story = {
  args: {
    headerStyle: 'hero',
    theme: 'amber',
    title: 'Figyelmeztetés',
    description: 'Ez a művelet nem vonható vissza.',
    size: 'md',
  },
};

/**
 * Zöld téma - sikeres művelet
 */
export const GreenTheme: Story = {
  args: {
    headerStyle: 'hero',
    theme: 'green',
    title: 'Sikeres művelet',
    description: 'A művelet sikeresen végrehajtva.',
    size: 'md',
  },
};

/**
 * Betöltés állapot - isSubmitting
 */
export const Submitting: Story = {
  args: {
    headerStyle: 'flat',
    theme: 'blue',
    title: 'Mentés folyamatban',
    description: 'Kérlek, várj...',
    size: 'md',
    isSubmitting: true,
  },
};

/**
 * Hibaüzenet megjelenítése
 */
export const WithError: Story = {
  args: {
    headerStyle: 'flat',
    theme: 'blue',
    title: 'Dialógus hibával',
    description: 'Ez a dialógus hibát jelenít meg.',
    size: 'md',
    errorMessage: 'Hiba történt a mentés során. Kérlek, próbáld újra.',
  },
};

/**
 * Nem zárható dialógus (closable: false)
 */
export const NotClosable: Story = {
  args: {
    headerStyle: 'flat',
    theme: 'purple',
    title: 'Kötelező kitöltés',
    description: 'Ez a dialógus nem zárható be, amíg ki nem töltöd.',
    size: 'md',
    closable: false,
  },
};
