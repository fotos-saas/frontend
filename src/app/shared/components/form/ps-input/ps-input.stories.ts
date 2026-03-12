import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { NgClass } from '@angular/common';
import { LucideAngularModule, Eye, EyeOff, CheckCircle, AlertCircle, HelpCircle, Search, Mail, Lock } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PsInputComponent } from './ps-input.component';

/**
 * PsInput - Szöveges beviteli mező
 *
 * ControlValueAccessor alapú input mező, ami támogatja:
 * - Többféle típus (text, email, password, number, tel, date, time, url)
 * - Prefix/suffix ikon vagy szöveg
 * - Jelszó láthatóság kapcsoló
 * - Szintaxis súgó popover
 * - Hibakezelés (error state + hibaüzenet)
 * - Méretek: xs, sm, md, lg, full
 */
const meta: Meta<PsInputComponent> = {
  title: 'Shared/Form/PsInput',
  component: PsInputComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        PsInputComponent,
        NgClass,
        MatTooltipModule,
        LucideAngularModule.pick({ Eye, EyeOff, CheckCircle, AlertCircle, HelpCircle, Search, Mail, Lock }),
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    label: { control: 'text', description: 'Mező címke' },
    placeholder: { control: 'text', description: 'Placeholder szöveg' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'date', 'time', 'url'],
      description: 'Input típus',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'full'],
      description: 'Mező méret',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Mező állapot',
    },
    errorMessage: { control: 'text', description: 'Hibaüzenet' },
    hint: { control: 'text', description: 'Segítő szöveg' },
    required: { control: 'boolean', description: 'Kötelező mező' },
    disabled: { control: 'boolean', description: 'Letiltott állapot' },
    readonly: { control: 'boolean', description: 'Csak olvasható' },
    prefix: { control: 'text', description: 'Prefix ikon (lucide ikon név)' },
    suffix: { control: 'text', description: 'Suffix ikon/szöveg' },
  },
};

export default meta;
type Story = StoryObj<PsInputComponent>;

/**
 * Default - alapértelmezett szöveges beviteli mező
 */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [type]="type"
        [size]="size"
      />
    `,
  }),
  args: {
    label: 'Név',
    placeholder: 'Írd be a neved...',
    type: 'text',
    size: 'full',
  },
};

/**
 * WithValue - kitöltött mező
 */
export const WithValue: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [type]="type"
        [state]="state"
      />
    `,
  }),
  args: {
    label: 'Email cím',
    placeholder: 'pelda@email.hu',
    type: 'email',
    state: 'success',
  },
};

/**
 * Password - jelszó mező láthatóság kapcsolóval
 */
export const Password: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [type]="type"
        [required]="required"
      />
    `,
  }),
  args: {
    label: 'Jelszó',
    placeholder: 'Jelszó megadása...',
    type: 'password',
    required: true,
  },
};

/**
 * WithPrefix - prefix ikonnal (pl. keresés)
 */
export const WithPrefix: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [prefix]="prefix"
      />
    `,
  }),
  args: {
    label: 'Keresés',
    placeholder: 'Keresés...',
    prefix: 'search',
  },
};

/**
 * WithSuffix - suffix szöveggel
 */
export const WithSuffix: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [type]="type"
        [suffix]="suffix"
      />
    `,
  }),
  args: {
    label: 'Ár',
    placeholder: '0',
    type: 'number',
    suffix: 'Ft',
  },
};

/**
 * Disabled - letiltott állapot
 */
export const Disabled: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [disabled]="disabled"
      />
    `,
  }),
  args: {
    label: 'Felhasználónév',
    placeholder: 'Nem szerkeszthető...',
    disabled: true,
  },
};

/**
 * Readonly - csak olvasható állapot
 */
export const Readonly: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [readonly]="readonly"
      />
    `,
  }),
  args: {
    label: 'Azonosító',
    readonly: true,
  },
};

/**
 * WithError - hibaüzenettel
 */
export const WithError: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [errorMessage]="errorMessage"
        [required]="required"
      />
    `,
  }),
  args: {
    label: 'Email cím',
    placeholder: 'pelda@email.hu',
    errorMessage: 'Érvénytelen email cím formátum.',
    required: true,
  },
};

/**
 * WithHint - segítő szöveggel
 */
export const WithHint: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [type]="type"
      />
    `,
  }),
  args: {
    label: 'Jelszó',
    placeholder: 'Legalább 8 karakter...',
    hint: 'A jelszónak legalább 8 karakter hosszúnak kell lennie.',
    type: 'password',
  },
};

/**
 * WithHelp - szintaxis súgóval
 */
export const WithHelp: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ps-input
        [label]="label"
        [placeholder]="placeholder"
        [helpItems]="helpItems"
        [helpTitle]="helpTitle"
      />
    `,
  }),
  args: {
    label: 'Keresés',
    placeholder: 'Szűrés...',
    helpTitle: 'Szintaxis súgó',
    helpItems: [
      { syntax: '#123', description: 'Projekt ID keresése' },
      { syntax: '@név', description: 'Felhasználó keresése' },
      { syntax: 'is:active', description: 'Aktív elemek szűrése' },
    ],
  },
};

/**
 * Sizes - minden méret egymás alatt
 */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <ps-input label="Extra kicsi (xs)" placeholder="xs méret" size="xs" />
        <ps-input label="Kicsi (sm)" placeholder="sm méret" size="sm" />
        <ps-input label="Közepes (md)" placeholder="md méret" size="md" />
        <ps-input label="Nagy (lg)" placeholder="lg méret" size="lg" />
        <ps-input label="Teljes (full)" placeholder="full méret" size="full" />
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
      <div class="dark" style="padding: 24px; background: #1e293b; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        <ps-input label="Név" placeholder="Írd be a neved..." />
        <ps-input label="Email" placeholder="pelda@email.hu" type="email" prefix="mail" />
        <ps-input label="Jelszó" placeholder="Jelszó megadása..." type="password" required />
        <ps-input label="Hibás mező" placeholder="..." errorMessage="Ez a mező kötelező." />
        <ps-input label="Letiltott" placeholder="Nem szerkeszthető" [disabled]="true" />
      </div>
    `,
  }),
};

/**
 * A11y - akadálymentességi variáns (required, error, aria attribútumok)
 */
export const A11y: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <ps-input
          label="Kötelező mező"
          placeholder="Ez kötelező..."
          [required]="true"
          fieldId="a11y-required"
        />
        <ps-input
          label="Hibás mező"
          placeholder="Hibás érték"
          errorMessage="A mező kitöltése kötelező."
          [required]="true"
          fieldId="a11y-error"
        />
        <ps-input
          label="Sikeres mező"
          placeholder="Helyes érték"
          state="success"
          fieldId="a11y-success"
        />
        <ps-input
          label="Segítő szöveggel"
          placeholder="..."
          hint="Ez egy segítő szöveg a mezőhöz."
          fieldId="a11y-hint"
        />
      </div>
    `,
  }),
};
