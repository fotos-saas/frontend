import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { NgClass } from '@angular/common';
import { PsCheckboxComponent } from './ps-checkbox.component';

/**
 * PsCheckbox - Jelölőnégyzet komponens
 *
 * ControlValueAccessor alapú checkbox, ami támogatja:
 * - Bejelölt / nem bejelölt / indeterminate állapot
 * - Label input vagy ng-content
 * - Error állapot hibaüzenettel
 * - Disabled / readonly állapot
 */
const meta: Meta<PsCheckboxComponent> = {
  title: 'Shared/Form/PsCheckbox',
  component: PsCheckboxComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PsCheckboxComponent, NgClass],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    label: { control: 'text', description: 'Jelölőnégyzet címke' },
    indeterminate: { control: 'boolean', description: 'Határozatlan állapot' },
    disabled: { control: 'boolean', description: 'Letiltott állapot' },
    readonly: { control: 'boolean', description: 'Csak olvasható' },
    required: { control: 'boolean', description: 'Kötelező mező' },
    errorMessage: { control: 'text', description: 'Hibaüzenet' },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Mező állapot',
    },
  },
};

export default meta;
type Story = StoryObj<PsCheckboxComponent>;

/**
 * Default - alapértelmezett jelölőnégyzet
 */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-checkbox [label]="label" />
    `,
  }),
  args: {
    label: 'Elfogadom a felhasználási feltételeket',
  },
};

/**
 * Selected - bejelölt állapot
 */
export const Selected: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-checkbox [label]="label" />
    `,
  }),
  args: {
    label: 'Értesítések fogadása emailben',
  },
};

/**
 * Indeterminate - határozatlan állapot (részbeni kijelölés)
 */
export const Indeterminate: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-checkbox [label]="label" [indeterminate]="indeterminate" />
    `,
  }),
  args: {
    label: 'Összes kijelölése',
    indeterminate: true,
  },
};

/**
 * Required - kötelező jelölőnégyzet
 */
export const Required: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-checkbox [label]="label" [required]="required" />
    `,
  }),
  args: {
    label: 'Elfogadom az adatvédelmi nyilatkozatot',
    required: true,
  },
};

/**
 * Disabled - letiltott állapot
 */
export const Disabled: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <ps-checkbox label="Letiltott (nem bejelölt)" [disabled]="true" />
        <ps-checkbox label="Letiltott (bejelölt)" [disabled]="true" />
      </div>
    `,
  }),
};

/**
 * WithError - hibaüzenettel
 */
export const WithError: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-checkbox
        [label]="label"
        [errorMessage]="errorMessage"
        [required]="required"
      />
    `,
  }),
  args: {
    label: 'Elfogadom a felhasználási feltételeket',
    errorMessage: 'A feltételek elfogadása kötelező a továbblépéshez.',
    required: true,
  },
};

/**
 * WithContentProjection - ng-content alapú címke
 */
export const WithContentProjection: Story = {
  render: () => ({
    template: `
      <ps-checkbox>
        Elfogadom az <a href="#" style="color: #7c3aed; text-decoration: underline;">adatvédelmi nyilatkozatot</a>
        és a <a href="#" style="color: #7c3aed; text-decoration: underline;">felhasználási feltételeket</a>
      </ps-checkbox>
    `,
  }),
};

/**
 * Group - jelölőnégyzet csoport
 */
export const Group: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p style="font-weight: 600; margin: 0 0 4px 0;">Értesítési beállítások</p>
        <ps-checkbox label="Email értesítések" />
        <ps-checkbox label="Push értesítések" />
        <ps-checkbox label="SMS értesítések" />
        <ps-checkbox label="Heti összefoglaló" />
      </div>
    `,
  }),
};

/**
 * DarkMode - sötét megjelenés
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => ({
    template: `
      <div class="dark" style="padding: 24px; background: #1e293b; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;">
        <ps-checkbox label="Alapértelmezett jelölőnégyzet" />
        <ps-checkbox label="Kötelező mező" [required]="true" />
        <ps-checkbox label="Határozatlan állapot" [indeterminate]="true" />
        <ps-checkbox label="Letiltott jelölőnégyzet" [disabled]="true" />
        <ps-checkbox
          label="Hibás jelölőnégyzet"
          errorMessage="Ez a mező kötelező."
        />
      </div>
    `,
  }),
};

/**
 * A11y - akadálymentességi variáns
 */
export const A11y: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px;">
        <ps-checkbox
          label="Kötelező jelölőnégyzet"
          [required]="true"
          fieldId="a11y-checkbox-required"
        />
        <ps-checkbox
          label="Hibás jelölőnégyzet"
          errorMessage="A feltételek elfogadása kötelező."
          [required]="true"
          fieldId="a11y-checkbox-error"
        />
        <ps-checkbox
          label="Határozatlan állapot"
          [indeterminate]="true"
          fieldId="a11y-checkbox-indeterminate"
        />
        <ps-checkbox
          label="Letiltott állapot"
          [disabled]="true"
          fieldId="a11y-checkbox-disabled"
        />
        <p style="font-size: 0.875rem; color: #64748b; margin-top: 8px;">
          Tipp: Használd a Space vagy Enter billentyűt az állapot váltásához.
        </p>
      </div>
    `,
  }),
};
