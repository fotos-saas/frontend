import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, argsToTemplate } from '@storybook/angular';
import { NgClass } from '@angular/common';
import { PsToggleComponent } from './ps-toggle.component';

const meta: Meta<PsToggleComponent> = {
  title: 'Form/PsToggle',
  component: PsToggleComponent,
  decorators: [
    moduleMetadata({
      imports: [NgClass],
    }),
  ],
  argTypes: {
    label: { control: 'text', description: 'Toggle felirat' },
    disabled: { control: 'boolean', description: 'Letiltott állapot' },
    readonly: { control: 'boolean', description: 'Csak olvasható' },
    labelPosition: {
      control: 'select',
      options: ['before', 'after'],
      description: 'Felirat pozíciója',
    },
    hint: { control: 'text', description: 'Segítő szöveg' },
    errorMessage: { control: 'text', description: 'Hibaüzenet' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'full'],
      description: 'Mező mérete',
    },
  },
  args: {
    label: 'Értesítések engedélyezése',
    disabled: false,
    readonly: false,
    labelPosition: 'after',
    hint: '',
    errorMessage: '',
    size: 'full',
  },
  render: (args) => ({
    props: args,
    template: `
      <ps-toggle
        ${argsToTemplate(args)}
      ></ps-toggle>
    `,
  }),
};

export default meta;
type Story = StoryObj<PsToggleComponent>;

/** Alapértelmezett toggle (kikapcsolt) */
export const Default: Story = {};

/** Bekapcsolt állapotú toggle */
export const WithValue: Story = {
  args: {
    label: 'Sötét mód aktív',
  },
  render: (args) => ({
    props: {
      ...args,
      initToggle(el: PsToggleComponent) {
        el.writeValue(true);
      },
    },
    template: `
      <ps-toggle
        #toggleEl
        ${argsToTemplate(args)}
        [attr.data-init]="initToggle(toggleEl)"
      ></ps-toggle>
    `,
  }),
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    label: 'Letiltott kapcsoló',
    disabled: true,
  },
};

/** Sötét mód */
export const DarkMode: Story = {
  args: {
    label: 'Sötét háttéren megjelenő toggle',
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="background: #1e1e2e; padding: 2rem; border-radius: 8px;">
        <ps-toggle
          ${argsToTemplate(args)}
        ></ps-toggle>
      </div>
    `,
  }),
};

/** Felirat a toggle előtt */
export const LabelBefore: Story = {
  args: {
    label: 'E-mail értesítések',
    labelPosition: 'before',
  },
};

/** Letiltott + bekapcsolt állapot */
export const DisabledChecked: Story = {
  args: {
    label: 'Kötelező beállítás',
    disabled: true,
  },
  render: (args) => ({
    props: {
      ...args,
      initToggle(el: PsToggleComponent) {
        el.writeValue(true);
      },
    },
    template: `
      <ps-toggle
        #toggleEl
        ${argsToTemplate(args)}
        [attr.data-init]="initToggle(toggleEl)"
      ></ps-toggle>
    `,
  }),
};

/** Több toggle egymás alatt */
export const MultipleToggles: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <ps-toggle label="E-mail értesítések"></ps-toggle>
        <ps-toggle label="Push értesítések"></ps-toggle>
        <ps-toggle label="SMS értesítések" [disabled]="true"></ps-toggle>
        <ps-toggle label="Hírlevél feliratkozás"></ps-toggle>
      </div>
    `,
  }),
};
