import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { FloatingFabComponent } from './floating-fab.component';

const meta: Meta<FloatingFabComponent> = {
  title: 'Shared/UI/FloatingFab',
  component: FloatingFabComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [FloatingFabComponent],
    }),
  ],
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
    ariaLabel: {
      control: 'text',
      description: 'Akadálymentesítési címke',
    },
  },
};

export default meta;
type Story = StoryObj<FloatingFabComponent>;

/** Alapértelmezett - kék info */
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
      <div style="height: 300px; position: relative;">
        <app-floating-fab
          [icon]="icon"
          [color]="color"
          [panelWidth]="panelWidth"
          [ariaLabel]="ariaLabel"
        >
          <p style="margin: 0; color: #374151; font-size: 14px;">
            Ez egy példa tartalom a FAB panelben. Kattints a gombra a megnyitáshoz.
          </p>
        </app-floating-fab>
      </div>
    `,
  }),
};

/** Lila kérdőjel */
export const PurpleQuestion: Story = {
  args: {
    icon: 'question',
    color: 'purple',
    panelWidth: 'normal',
    ariaLabel: 'Segítség',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 300px; position: relative;">
        <app-floating-fab
          [icon]="icon"
          [color]="color"
          [panelWidth]="panelWidth"
          [ariaLabel]="ariaLabel"
        >
          <p style="margin: 0; color: #374151; font-size: 14px;">
            Segítségre van szükséged? Itt megtalálod a válaszokat.
          </p>
        </app-floating-fab>
      </div>
    `,
  }),
};

/** Széles panel */
export const WidePanel: Story = {
  args: {
    icon: 'info',
    color: 'blue',
    panelWidth: 'wide',
    ariaLabel: 'Részletes információ',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 300px; position: relative;">
        <app-floating-fab
          [icon]="icon"
          [color]="color"
          [panelWidth]="panelWidth"
          [ariaLabel]="ariaLabel"
        >
          <div style="color: #374151; font-size: 14px;">
            <h4 style="margin: 0 0 8px;">Információ</h4>
            <p style="margin: 0;">Ez egy szélesebb panel több tartalommal.</p>
          </div>
        </app-floating-fab>
      </div>
    `,
  }),
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    icon: 'info',
    color: 'blue',
    panelWidth: 'normal',
    ariaLabel: 'Információ',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 300px; position: relative;">
        <app-floating-fab
          [icon]="icon"
          [color]="color"
          [panelWidth]="panelWidth"
          [ariaLabel]="ariaLabel"
        >
          <p style="margin: 0; color: #374151; font-size: 14px;">
            Sötét módú tartalom.
          </p>
        </app-floating-fab>
      </div>
    `,
  }),
};
