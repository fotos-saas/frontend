import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InfoBoxComponent } from './info-box.component';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { A11yModule } from '@angular/cdk/a11y';
import { ICONS } from '../../constants/icons.constants';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

/**
 * ## Info Box
 *
 * Informacios banner / sugo dialog komponens.
 *
 * ### Jellemzok:
 * - **4 tema:** blue (info), green (siker), amber (figyelmeztetes), red (hiba)
 * - **2 mod:** inline (banner, eltuntetheto) es dialog (? gomb + felugro)
 * - localStorage alapu eltuntetes megjegyzes
 * - ng-content a tartalom projectionhoz
 */
const meta: Meta<InfoBoxComponent> = {
  title: 'Shared/InfoBox',
  component: InfoBoxComponent,
  decorators: [
    moduleMetadata({
      imports: [
        InfoBoxComponent,
        LucideAngularModule,
        MatTooltipModule,
        DialogWrapperComponent,
        A11yModule,
        NoopAnimationsModule,
      ],
    }),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    storageKey: {
      control: 'text',
      description: 'Egyedi kulcs a localStorage-ban',
    },
    title: {
      control: 'text',
      description: 'Banner cime',
    },
    theme: {
      control: 'select',
      options: ['blue', 'green', 'amber', 'red'],
      description: 'Szin tema',
    },
    icon: {
      control: 'text',
      description: 'Lucide ikon neve',
    },
    mode: {
      control: 'select',
      options: ['inline', 'dialog'],
      description: 'Megjelenitesi mod',
    },
  },
};

export default meta;
type Story = StoryObj<InfoBoxComponent>;

// ============================================================================
// TEMA VARIANSOK
// ============================================================================

/**
 * Info - Kek informacios banner (alapertelmezett)
 */
export const Info: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem;">
        <app-info-box
          storageKey="story-info"
          title="Informacio"
          theme="blue"
          [icon]="ICONS.INFO"
          mode="inline"
        >
          Ez egy informacios banner. A felhasznalot tajekoztatja fontos tudnivalokrol.
          A jobb felso sarokban levo X gombbal eltuntetheto.
        </app-info-box>
      </div>
    `,
  }),
};

/**
 * Warning - Sarga figyelmezteto banner
 */
export const Warning: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem;">
        <app-info-box
          storageKey="story-warning"
          title="Figyelmeztetes"
          theme="amber"
          [icon]="ICONS.ALERT_TRIANGLE"
          mode="inline"
        >
          A tarhelyed majdnem megtelt. Kerlek torolj felesleges fajlokat, vagy bovitsd az elofizetesed.
        </app-info-box>
      </div>
    `,
  }),
};

/**
 * Success - Zold sikeres banner
 */
export const Success: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem;">
        <app-info-box
          storageKey="story-success"
          title="Sikeres mentes"
          theme="green"
          [icon]="ICONS.CHECK_CIRCLE"
          mode="inline"
        >
          A beallitasaid sikeresen mentesre kerultek. A valtozasok azonnal ervenybe lepnek.
        </app-info-box>
      </div>
    `,
  }),
};

/**
 * Error - Piros hiba banner
 */
export const Error: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem;">
        <app-info-box
          storageKey="story-error"
          title="Hiba tortent"
          theme="red"
          [icon]="ICONS.ALERT_CIRCLE"
          mode="inline"
        >
          Nem sikerult csatlakozni a szerverhez. Kerlek ellenorizd az internetkapcsolatodat es probald ujra.
        </app-info-box>
      </div>
    `,
  }),
};

// ============================================================================
// MODOK
// ============================================================================

/**
 * Dialog mod - ? gomb + felugro dialog
 */
export const DialogMode: Story = {
  render: (args) => ({
    props: { ...args, ICONS },
    template: `
      <div style="padding: 1rem;">
        <p style="color: #6b7280; margin-bottom: 0.5rem; font-size: 0.875rem;">Kattints a ? gombra a sugo megnyitasahoz:</p>
        <app-info-box
          storageKey="story-dialog"
          title="Sugo"
          theme="blue"
          [icon]="ICONS.HELP_CIRCLE"
          mode="dialog"
        >
          <div dialogContent>
            <p style="color: #374151; line-height: 1.6;">Ez a sugo dialog tartalom. A dialog modban a komponens egy kis ? gombot jelenít meg, amire kattintva felugrik a reszletes informacio.</p>
          </div>
        </app-info-box>
      </div>
    `,
  }),
};

/**
 * Osszes tema egyutt
 */
export const AllThemes: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem; display: flex; flex-direction: column;">
        <div style="margin-bottom: 12px;">
          <app-info-box storageKey="story-all-info" title="Informacio" theme="blue" [icon]="ICONS.INFO" mode="inline">
            Kek informacios banner peldatartalommal.
          </app-info-box>
        </div>
        <div style="margin-bottom: 12px;">
          <app-info-box storageKey="story-all-success" title="Sikeres" theme="green" [icon]="ICONS.CHECK_CIRCLE" mode="inline">
            Zold sikeres banner peldatartalommal.
          </app-info-box>
        </div>
        <div style="margin-bottom: 12px;">
          <app-info-box storageKey="story-all-warning" title="Figyelmeztetes" theme="amber" [icon]="ICONS.ALERT_TRIANGLE" mode="inline">
            Sarga figyelmezteto banner peldatartalommal.
          </app-info-box>
        </div>
        <div>
          <app-info-box storageKey="story-all-error" title="Hiba" theme="red" [icon]="ICONS.ALERT_CIRCLE" mode="inline">
            Piros hiba banner peldatartalommal.
          </app-info-box>
        </div>
      </div>
    `,
  }),
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/**
 * DarkMode - Sotet hatter
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => ({
    props: { ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem;">
        <app-info-box
          storageKey="story-dark"
          title="Sotet mod"
          theme="blue"
          [icon]="ICONS.MOON"
          mode="inline"
        >
          A banner sotet hatterrel is jol olvashato es hasznalhato.
        </app-info-box>
      </div>
    `,
  }),
};

/**
 * A11y - Akadalymentesseg
 */
export const A11y: Story = {
  render: () => ({
    props: { ICONS },
    template: `
      <div style="max-width: 600px; padding: 1rem;">
        <app-info-box
          storageKey="story-a11y"
          title="Akadalymentes banner"
          theme="blue"
          [icon]="ICONS.SHIELD_CHECK"
          mode="inline"
        >
          A banner matTooltip-et hasznal a gombokhoz. A bezaras X gombbal vagy a kis ? ikonnal tortenik.
          A dialog modban a teljes dialog akadalymentes (focus trap, ESC bezaras).
        </app-info-box>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'matTooltip a gombokhoz, dialog modban focus trap + ARIA attributumok.',
      },
    },
  },
};
