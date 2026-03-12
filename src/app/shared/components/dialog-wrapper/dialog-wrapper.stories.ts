import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { DialogWrapperComponent } from './dialog-wrapper.component';
import { LucideAngularModule } from 'lucide-angular';
import { A11yModule } from '@angular/cdk/a11y';
import { ICONS } from '@shared/constants/icons.constants';

/**
 * ## Dialog Wrapper
 *
 * Univerzális dialógus wrapper komponens.
 *
 * ### Jellemzok:
 * - **3 header stilus:** hero (gradient + nagy ikon), flat (border-bottom + kis ikon), minimal (csak cim)
 * - **3 meret:** sm (384px), md (480px), lg (800px)
 * - **5 tema:** purple, green, blue, red, amber
 * - **Slotok:** dialogBody, dialogLeft/dialogRight (2-column), dialogFooter, dialogExtra
 * - ESC bezaras, Enter submit, focus trap, body scroll lock
 */
const meta: Meta<DialogWrapperComponent> = {
  title: 'Shared/Dialogs/DialogWrapper',
  component: DialogWrapperComponent,
  decorators: [
    moduleMetadata({
      imports: [DialogWrapperComponent, LucideAngularModule, A11yModule],
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
    headerStyle: {
      control: 'select',
      options: ['hero', 'flat', 'minimal'],
      description: 'Header megjelenes stilusa',
    },
    theme: {
      control: 'select',
      options: ['purple', 'blue', 'green', 'red', 'amber'],
      description: 'Szin tema',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Dialog merete',
    },
    closable: {
      control: 'boolean',
      description: 'Bezarhato-e ESC/backdrop klikkel',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Kuldesi allapot (blokkolja a bezarast)',
    },
    footerAlign: {
      control: 'select',
      options: ['end', 'center', 'stretch'],
      description: 'Footer igazitas',
    },
    columns: {
      control: 'select',
      options: [1, 2],
      description: 'Oszlopok szama (1 vagy 2)',
    },
  },
};

export default meta;
type Story = StoryObj<DialogWrapperComponent>;

// ============================================================================
// HEADER STILUSOK
// ============================================================================

/**
 * Hero header - Gradient hatter, nagy ikon
 */
export const HeroHeader: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="purple"
        [icon]="ICONS.SPARKLES"
        title="Uj projekt letrehozasa"
        description="Toltsd ki az alabbi mezokat az uj projekt letrehozasahoz."
        size="md"
        footerAlign="end"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Itt jelenik meg a dialog tartalma.</p>
          <div style="margin-top: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Projekt neve</label>
            <input type="text" placeholder="Projekt neve..." style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box;" />
          </div>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; cursor: pointer; margin-right: 0.5rem;">Megse</button>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #8b5cf6; color: white; cursor: pointer;">Letrehozas</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Flat header - Border-bottom, kis ikon
 */
export const FlatHeader: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="flat"
        theme="blue"
        [icon]="ICONS.EDIT"
        title="Profil szerkesztese"
        description="Modositsd az adataidat."
        size="md"
        footerAlign="end"
      >
        <div dialogBody style="padding: 1rem;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Nev</label>
            <input type="text" value="Kovacs Janos" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box;" />
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Email</label>
            <input type="email" value="kovacs@pelda.hu" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box;" />
          </div>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; cursor: pointer; margin-right: 0.5rem;">Megse</button>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">Mentes</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Minimal header - Csak cim, ikon nelkul
 */
export const MinimalHeader: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="minimal"
        theme="blue"
        title="Gyors megerosites"
        size="sm"
        footerAlign="center"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0; text-align: center;">Biztosan folytatod a muveletet?</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; cursor: pointer; margin-right: 0.5rem;">Megse</button>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">Rendben</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

// ============================================================================
// SZIN TEMAK
// ============================================================================

/**
 * Purple tema
 */
export const ThemePurple: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="purple"
        [icon]="ICONS.SPARKLES"
        title="Lila tema"
        description="Purple/lila szin tema bemutatasa."
        size="sm"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Lila szinu hero header gradient hatrerrel.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #8b5cf6; color: white; cursor: pointer;">Tovabb</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Green tema
 */
export const ThemeGreen: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="green"
        [icon]="ICONS.CHECK_CIRCLE"
        title="Zold tema"
        description="Green/zold szin tema bemutatasa."
        size="sm"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Zold szinu hero header, sikeres muveletekhez.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #22c55e; color: white; cursor: pointer;">Kesz</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Blue tema
 */
export const ThemeBlue: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="blue"
        [icon]="ICONS.INFO"
        title="Kek tema"
        description="Blue/kek szin tema bemutatasa."
        size="sm"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Kek szinu hero header, informacios celokra.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">Ertem</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Red tema
 */
export const ThemeRed: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="red"
        [icon]="ICONS.ALERT_TRIANGLE"
        title="Piros tema"
        description="Red/piros szin tema bemutatasa."
        size="sm"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Piros szinu hero header, veszelyes muveletekhez.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #ef4444; color: white; cursor: pointer;">Torles</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Amber tema
 */
export const ThemeAmber: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="amber"
        [icon]="ICONS.ALERT_TRIANGLE"
        title="Sarga tema"
        description="Amber/sarga szin tema bemutatasa."
        size="sm"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Sarga szinu hero header, figyelmeztetesekhez.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #f59e0b; color: white; cursor: pointer;">Figyelem</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

// ============================================================================
// MERETEK
// ============================================================================

/**
 * Small meret (384px)
 */
export const SizeSmall: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="flat"
        theme="blue"
        [icon]="ICONS.INFO"
        title="Kis dialog (sm)"
        size="sm"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Ez egy kis meretu dialog (384px).</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">OK</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Large meret (800px)
 */
export const SizeLarge: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="flat"
        theme="blue"
        [icon]="ICONS.SETTINGS"
        title="Nagy dialog (lg)"
        description="Ez egy nagy meretu dialog ket oszlopos elrendezessel."
        size="lg"
        [columns]="2"
      >
        <div dialogLeft style="padding: 1rem;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.95rem; color: #1f2937;">Bal oldal</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.875rem;">A ket oszlopos elrendezes bal oldala. Hasznos komplex formokhoz.</p>
        </div>
        <div dialogRight style="padding: 1rem;">
          <h3 style="margin: 0 0 0.5rem; font-size: 0.95rem; color: #1f2937;">Jobb oldal</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.875rem;">A ket oszlopos elrendezes jobb oldala. Elovalaszto, beallitasok stb.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; cursor: pointer; margin-right: 0.5rem;">Megse</button>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">Mentes</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

// ============================================================================
// ALLAPOTOK
// ============================================================================

/**
 * Hibauzenettel
 */
export const WithError: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="flat"
        theme="red"
        [icon]="ICONS.ALERT_CIRCLE"
        title="Beallitasok mentese"
        size="md"
        errorMessage="Nem sikerult menteni. Kerlek probald ujra!"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">Hibas allapot bemutatasa, amikor a szerver hibat ad vissza.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; cursor: pointer; margin-right: 0.5rem;">Megse</button>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">Ujraproba</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * Submitting allapot
 */
export const Submitting: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="flat"
        theme="blue"
        [icon]="ICONS.SAVE"
        title="Mentes folyamatban"
        size="md"
        [isSubmitting]="true"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">A dialog kuldesi allapotban van - az X gomb le van tiltva.</p>
        </div>
        <div dialogFooter>
          <button disabled style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: #f3f4f6; cursor: not-allowed; margin-right: 0.5rem; color: #9ca3af;">Megse</button>
          <button disabled style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #93c5fd; color: white; cursor: not-allowed;">Mentes...</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/**
 * DarkMode - sotet hatter
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="hero"
        theme="purple"
        [icon]="ICONS.MOON"
        title="Sotet mod"
        description="Sotet hatteres megjelenes."
        size="md"
      >
        <div dialogBody style="padding: 1rem;">
          <p style="color: #6b7280; margin: 0;">A dialog sotet hatterrel is jol mukodik.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #8b5cf6; color: white; cursor: pointer;">Rendben</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};

/**
 * A11y - Accessibility
 */
export const A11y: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Akadalymentesseg: ARIA role="dialog", aria-modal, aria-labelledby, focus trap, ESC bezaras, Enter submit.',
      },
    },
  },
  render: () => ({
    props: { ICONS },
    template: `
      <app-dialog-wrapper
        headerStyle="flat"
        theme="blue"
        [icon]="ICONS.SHIELD_CHECK"
        title="Akadalymentes dialog"
        description="Focus trap aktiv, ESC bezar, Enter submit-ol."
        size="md"
      >
        <div dialogBody style="padding: 1rem;">
          <div style="margin-bottom: 1rem;">
            <label for="a11y-input" style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Beviteli mezo (auto-focus)</label>
            <input id="a11y-input" type="text" placeholder="Ird be..." style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; box-sizing: border-box;" />
          </div>
          <p style="color: #6b7280; margin: 0; font-size: 0.8125rem;">A Tab billentyuvel navigalhatsz a mezoek kozott. A fokusz nem hagyja el a dialogust.</p>
        </div>
        <div dialogFooter>
          <button style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: white; cursor: pointer; margin-right: 0.5rem;">Megse</button>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer;">Mentes</button>
        </div>
      </app-dialog-wrapper>
    `,
  }),
};
