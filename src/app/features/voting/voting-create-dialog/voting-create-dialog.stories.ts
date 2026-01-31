import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { VotingCreateDialogComponent } from './voting-create-dialog.component';

/**
 * Voting Create Dialog Stories
 * Szavazás létrehozó dialógus - Storybook demo
 *
 * Állapotok tesztelése:
 * - Default (üres form)
 * - WithOptions (kitöltött opciókkal)
 * - ValidationError (validációs hiba)
 * - Submitting (küldés folyamatban)
 * - WithError (szerver hiba)
 * - DarkMode
 * - Accessibility (a11y)
 */

const meta: Meta<VotingCreateDialogComponent> = {
  title: 'Features/Voting/Voting Create Dialog',
  component: VotingCreateDialogComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Szavazás létrehozó dialógus. Lehetővé teszi új szavazás létrehozását címmel, leírással és opciókkal.',
      },
    },
  },
  argTypes: {
    errorMessage: {
      control: 'text',
      description: 'Hibaüzenet a szervertől',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Küldés folyamatban jelző',
    },
    result: {
      description: 'Form eredmény event (create vagy cancel)',
    },
  },
};

export default meta;
type Story = StoryObj<VotingCreateDialogComponent>;

// ============================================================================
// DEFAULT STATE (Üres form)
// ============================================================================

/**
 * Default state: üres form
 * - Cím input (üres)
 * - Leírás input (üres)
 * - 2 üres opció
 * - Submit gomb disabled
 */
export const Default: Story = {
  args: {
    errorMessage: null,
    isSubmitting: false,
    result: action('result'),
  },
};

// ============================================================================
// WITH OPTIONS (Kitöltött opciókkal)
// ============================================================================

/**
 * Kitöltött form érvényes adatokkal
 * - Cím kitöltve
 * - 3 opció megadva
 * - Submit gomb enabled
 */
export const WithOptions: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    // Form kitöltése story render után
    const titleInput = canvasElement.querySelector('input[name="title"]') as HTMLInputElement;
    const optionInputs = canvasElement.querySelectorAll('input[name^="option"]') as NodeListOf<HTMLInputElement>;

    if (titleInput) {
      titleInput.value = 'Melyik hátteret válasszuk?';
      titleInput.dispatchEvent(new Event('input'));
    }

    if (optionInputs[0]) {
      optionInputs[0].value = 'Kék gradiens';
      optionInputs[0].dispatchEvent(new Event('input'));
    }

    if (optionInputs[1]) {
      optionInputs[1].value = 'Fehér minimalista';
      optionInputs[1].dispatchEvent(new Event('input'));
    }
  },
};

// ============================================================================
// VALIDATION ERROR (Validációs hiba)
// ============================================================================

/**
 * Validációs hiba állapot
 * - Cím túl rövid (< 3 karakter)
 * - Kevés opció
 * - Submit gomb disabled
 */
export const ValidationError: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    const titleInput = canvasElement.querySelector('input[name="title"]') as HTMLInputElement;
    if (titleInput) {
      titleInput.value = 'AB'; // Túl rövid
      titleInput.dispatchEvent(new Event('input'));
    }
  },
};

// ============================================================================
// SUBMITTING (Küldés folyamatban)
// ============================================================================

/**
 * Küldés folyamatban
 * - Spinner megjelenítése
 * - Gombok disabled
 * - Form nem szerkeszthető
 */
export const Submitting: Story = {
  args: {
    ...Default.args,
    isSubmitting: true,
  },
};

// ============================================================================
// WITH ERROR (Szerver hiba)
// ============================================================================

/**
 * Szerver hiba megjelenítése
 * - Hibaüzenet a form felett
 * - Form szerkeszthető marad
 */
export const WithError: Story = {
  args: {
    ...Default.args,
    errorMessage: 'Hiba történt a szavazás létrehozásakor. Próbáld újra!',
  },
};

// ============================================================================
// MULTIPLE CHOICE (Több választásos)
// ============================================================================

/**
 * Több választásos szavazás beállítás
 * - Checkbox bejelölve
 */
export const MultipleChoice: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    const checkbox = canvasElement.querySelector('input[name="isMultipleChoice"]') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }
  },
};

// ============================================================================
// MAX OPTIONS (Maximum opciók)
// ============================================================================

/**
 * Maximum 10 opcióval
 * - "Opció hozzáadása" gomb disabled
 */
export const MaxOptions: Story = {
  args: {
    ...Default.args,
  },
};

// ============================================================================
// DARK MODE
// ============================================================================

/**
 * Dark mode megjelenés
 */
export const DarkMode: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark-mode" style="padding: 2rem; background: #1f2937; border-radius: 12px;">${story}</div>`,
    }),
  ],
};

// ============================================================================
// ACCESSIBILITY (A11y)
// ============================================================================

/**
 * Accessibility teszt
 * - Keyboard navigáció
 * - ARIA labelek
 * - Focus management
 * - Error announcement
 */
export const A11y: Story = {
  args: {
    ...Default.args,
    errorMessage: 'Teszt hibaüzenet az accessibility teszthez',
  },
  parameters: {
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'form-field-multiple-labels', enabled: true },
        ],
      },
    },
  },
};
