import type { Meta, StoryObj } from '@storybook/angular';
import { FloatingFabComponent } from './floating-fab.component';

const meta: Meta<FloatingFabComponent> = {
  title: 'Shared/FloatingFab',
  component: FloatingFabComponent,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['info', 'question'],
      description: 'Ikon típusa',
    },
    color: {
      control: 'select',
      options: ['purple', 'blue'],
      description: 'Szín téma',
    },
    panelWidth: {
      control: 'select',
      options: ['normal', 'wide'],
      description: 'Panel szélesség',
    },
    ariaLabel: { control: 'text', description: 'Aria label a gombhoz' },
  },
  // A FAB fixed pozíciójú, ezért a story-kat egy konténerben jelenítjük meg
  decorators: [
    () => ({
      styles: [`
        :host {
          display: block;
          height: 400px;
          position: relative;
        }
        /* Felülírjuk a fixed pozíciót a Storybook-hoz */
        :host ::ng-deep app-floating-fab {
          position: absolute !important;
          bottom: 24px !important;
          right: 24px !important;
        }
      `],
    }),
  ],
};

export default meta;
type Story = StoryObj<FloatingFabComponent>;

/** Default - kék info ikon */
export const Default: Story = {
  args: {
    icon: 'info',
    color: 'blue',
    panelWidth: 'normal',
    ariaLabel: 'Információ',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-floating-fab
        [icon]="icon"
        [color]="color"
        [panelWidth]="panelWidth"
        [ariaLabel]="ariaLabel"
      >
        <div style="font-size: 14px; color: #334155;">
          <p style="margin: 0 0 8px; font-weight: 600;">Segítség</p>
          <p style="margin: 0; color: #64748b;">Ez egy informatív panel tartalom.</p>
        </div>
      </app-floating-fab>`,
  }),
};

/** Lila kérdőjel ikon */
export const PurpleQuestion: Story = {
  name: 'Lila kérdőjel',
  args: {
    icon: 'question',
    color: 'purple',
    panelWidth: 'normal',
    ariaLabel: 'Segítség',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-floating-fab
        [icon]="icon"
        [color]="color"
        [panelWidth]="panelWidth"
        [ariaLabel]="ariaLabel"
      >
        <div style="font-size: 14px; color: #334155;">
          <p style="margin: 0 0 8px; font-weight: 600;">Gyakori kérdések</p>
          <p style="margin: 0; color: #64748b;">Kattints ide a részletekért!</p>
        </div>
      </app-floating-fab>`,
  }),
};

/** Széles panel változat */
export const WidePanel: Story = {
  name: 'Széles panel',
  args: {
    icon: 'info',
    color: 'blue',
    panelWidth: 'wide',
    ariaLabel: 'Részletes információ',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-floating-fab
        [icon]="icon"
        [color]="color"
        [panelWidth]="panelWidth"
        [ariaLabel]="ariaLabel"
      >
        <div style="font-size: 14px; color: #334155;">
          <p style="margin: 0 0 8px; font-weight: 600;">Tudtad?</p>
          <p style="margin: 0 0 8px; color: #64748b;">A széles panel több tartalmat képes megjeleníteni.</p>
          <ul style="margin: 0; padding-left: 16px; color: #64748b;">
            <li>Első tipp a használathoz</li>
            <li>Második tipp a használathoz</li>
            <li>Harmadik tipp a használathoz</li>
          </ul>
        </div>
      </app-floating-fab>`,
  }),
};

/** Kék info ikon */
export const BlueInfo: Story = {
  name: 'Kék info',
  args: {
    icon: 'info',
    color: 'blue',
    panelWidth: 'normal',
    ariaLabel: 'Információ',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-floating-fab
        [icon]="icon"
        [color]="color"
        [panelWidth]="panelWidth"
        [ariaLabel]="ariaLabel"
      >
        <div style="font-size: 14px; color: #334155;">
          <p style="margin: 0;">Kék témájú információs panel.</p>
        </div>
      </app-floating-fab>`,
  }),
};

/** Sötét mód */
export const DarkMode: Story = {
  name: 'Sötét mód',
  args: {
    icon: 'info',
    color: 'purple',
    panelWidth: 'normal',
    ariaLabel: 'Információ',
  },
  decorators: [
    () => ({
      styles: [`
        :host {
          display: block;
          height: 400px;
          position: relative;
          background: #1e293b;
        }
        :host ::ng-deep app-floating-fab {
          position: absolute !important;
          bottom: 24px !important;
          right: 24px !important;
        }
      `],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="height: 100%;">
        <app-floating-fab
          [icon]="icon"
          [color]="color"
          [panelWidth]="panelWidth"
          [ariaLabel]="ariaLabel"
        >
          <div style="font-size: 14px; color: #334155;">
            <p style="margin: 0 0 8px; font-weight: 600;">Sötét mód</p>
            <p style="margin: 0; color: #64748b;">Panel tartalom sötét háttéren.</p>
          </div>
        </app-floating-fab>
      </div>`,
  }),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Akadálymentesség (A11y) */
export const A11y: Story = {
  name: 'Akadálymentesség',
  args: {
    icon: 'question',
    color: 'purple',
    panelWidth: 'normal',
    ariaLabel: 'Segítség gomb',
  },
  render: (args) => ({
    props: args,
    template: `
      <div role="region" aria-label="Lebegő akciógomb">
        <app-floating-fab
          [icon]="icon"
          [color]="color"
          [panelWidth]="panelWidth"
          [ariaLabel]="ariaLabel"
        >
          <div style="font-size: 14px; color: #334155;">
            <p style="margin: 0 0 8px; font-weight: 600;">Akadálymentes panel</p>
            <p style="margin: 0; color: #64748b;">
              A gomb aria-expanded attribútummal jelzi a panel állapotát.
              ESC billentyűvel bezárható.
            </p>
          </div>
        </app-floating-fab>
      </div>`,
  }),
};
