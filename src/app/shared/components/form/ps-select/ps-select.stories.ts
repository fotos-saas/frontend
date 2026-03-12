import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { NgClass } from '@angular/common';
import { LucideAngularModule, Check, ChevronDown, AlertCircle } from 'lucide-angular';
import { PsSelectComponent } from './ps-select.component';
import { PsSelectOption } from '../form.types';

/**
 * PsSelect - Legördülő választó komponens
 *
 * ControlValueAccessor alapú select, ami támogatja:
 * - Dropdown variáns (hagyományos legördülő)
 * - Cards variáns (kártya alapú választó, horizontal/vertical)
 * - Overlay-alapú dropdown (document.body-ra portalolva)
 * - Billentyűzet navigáció (nyilak, Enter, Escape)
 * - Disabled opciók
 * - Sublabel az opcióknál
 */
const meta: Meta<PsSelectComponent> = {
  title: 'Shared/Form/PsSelect',
  component: PsSelectComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        PsSelectComponent,
        NgClass,
        LucideAngularModule.pick({ Check, ChevronDown, AlertCircle }),
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    label: { control: 'text', description: 'Mező címke' },
    emptyLabel: { control: 'text', description: 'Placeholder szöveg' },
    variant: {
      control: 'select',
      options: ['dropdown', 'cards'],
      description: 'Megjelenítési variáns',
    },
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Cards variáns iránya',
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
  },
};

export default meta;
type Story = StoryObj<PsSelectComponent>;

const schoolOptions: PsSelectOption[] = [
  { id: '1', label: 'Boronkay György Műszaki Technikum' },
  { id: '2', label: 'Jedlik Ányos Gépipari Technikum' },
  { id: '3', label: 'Széchenyi István Gimnázium' },
  { id: '4', label: 'Petőfi Sándor Általános Iskola' },
  { id: '5', label: 'Kölcsey Ferenc Gimnázium' },
];

const classOptions: PsSelectOption[] = [
  { id: '12a', label: '12.A' },
  { id: '12b', label: '12.B' },
  { id: '12c', label: '12.C' },
  { id: '12d', label: '12.D', disabled: true },
];

const planOptions: PsSelectOption[] = [
  { id: 'alap', label: 'Alap csomag', sublabel: '5 GB tárhely, 10 osztály' },
  { id: 'iskola', label: 'Iskola csomag', sublabel: '100 GB tárhely, 20 osztály' },
  { id: 'studio', label: 'Stúdió csomag', sublabel: '500 GB tárhely, korlátlan' },
];

/**
 * Default - alapértelmezett legördülő
 */
export const Default: Story = {
  render: (args) => ({
    props: { ...args, options: schoolOptions },
    template: `
      <ps-select
        [label]="label"
        [emptyLabel]="emptyLabel"
        [options]="options"
        [size]="size"
      />
    `,
  }),
  args: {
    label: 'Iskola',
    emptyLabel: 'Válassz iskolát...',
    size: 'full',
  },
};

/**
 * WithSelection - egy elem kiválasztva
 */
export const WithSelection: Story = {
  render: (args) => ({
    props: { ...args, options: classOptions },
    template: `
      <ps-select
        [label]="label"
        [emptyLabel]="emptyLabel"
        [options]="options"
        [required]="required"
      />
    `,
  }),
  args: {
    label: 'Osztály',
    emptyLabel: 'Válassz osztályt...',
    required: true,
  },
};

/**
 * WithDisabledOptions - néhány opció letiltva
 */
export const WithDisabledOptions: Story = {
  render: (args) => ({
    props: { ...args, options: classOptions },
    template: `
      <ps-select
        [label]="label"
        [emptyLabel]="emptyLabel"
        [options]="options"
        [hint]="hint"
      />
    `,
  }),
  args: {
    label: 'Osztály',
    emptyLabel: 'Válassz...',
    hint: 'A 12.D osztály jelenleg nem elérhető.',
  },
};

/**
 * WithSublabels - opciók alcímkével
 */
export const WithSublabels: Story = {
  render: (args) => ({
    props: { ...args, options: planOptions },
    template: `
      <ps-select
        [label]="label"
        [emptyLabel]="emptyLabel"
        [options]="options"
      />
    `,
  }),
  args: {
    label: 'Előfizetési csomag',
    emptyLabel: 'Válassz csomagot...',
  },
};

/**
 * Disabled - letiltott állapot
 */
export const Disabled: Story = {
  render: (args) => ({
    props: { ...args, options: schoolOptions },
    template: `
      <ps-select
        [label]="label"
        [emptyLabel]="emptyLabel"
        [options]="options"
        [disabled]="disabled"
      />
    `,
  }),
  args: {
    label: 'Iskola',
    emptyLabel: 'Válassz iskolát...',
    disabled: true,
  },
};

/**
 * WithError - hibaüzenettel
 */
export const WithError: Story = {
  render: (args) => ({
    props: { ...args, options: schoolOptions },
    template: `
      <ps-select
        [label]="label"
        [emptyLabel]="emptyLabel"
        [options]="options"
        [errorMessage]="errorMessage"
        [required]="required"
      />
    `,
  }),
  args: {
    label: 'Iskola',
    emptyLabel: 'Válassz iskolát...',
    errorMessage: 'Az iskola kiválasztása kötelező.',
    required: true,
  },
};

/**
 * CardsHorizontal - kártya variáns vízszintesen
 */
export const CardsHorizontal: Story = {
  render: (args) => ({
    props: { ...args, options: planOptions },
    template: `
      <ps-select
        [label]="label"
        [options]="options"
        variant="cards"
        direction="horizontal"
      />
    `,
  }),
  args: {
    label: 'Válaszd ki a csomagodat',
  },
};

/**
 * CardsVertical - kártya variáns függőlegesen
 */
export const CardsVertical: Story = {
  render: (args) => ({
    props: { ...args, options: planOptions },
    template: `
      <ps-select
        [label]="label"
        [options]="options"
        variant="cards"
        direction="vertical"
      />
    `,
  }),
  args: {
    label: 'Válaszd ki a csomagodat',
  },
};

/**
 * Sizes - minden méret egymás alatt (dropdown variáns)
 */
export const Sizes: Story = {
  render: () => ({
    props: { options: schoolOptions },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <ps-select label="Extra kicsi (xs)" emptyLabel="Válassz..." [options]="options" size="xs" />
        <ps-select label="Kicsi (sm)" emptyLabel="Válassz..." [options]="options" size="sm" />
        <ps-select label="Közepes (md)" emptyLabel="Válassz..." [options]="options" size="md" />
        <ps-select label="Nagy (lg)" emptyLabel="Válassz..." [options]="options" size="lg" />
        <ps-select label="Teljes (full)" emptyLabel="Válassz..." [options]="options" size="full" />
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
    props: {
      schoolOptions,
      classOptions,
      planOptions,
    },
    template: `
      <div class="dark" style="padding: 24px; background: #1e293b; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        <ps-select label="Iskola" emptyLabel="Válassz iskolát..." [options]="schoolOptions" />
        <ps-select label="Osztály" emptyLabel="Válassz osztályt..." [options]="classOptions" />
        <ps-select label="Hibás" emptyLabel="Válassz..." [options]="schoolOptions" errorMessage="A mező kitöltése kötelező." [required]="true" />
        <ps-select label="Letiltott" emptyLabel="Válassz..." [options]="schoolOptions" [disabled]="true" />
        <ps-select label="Csomag (kártyák)" [options]="planOptions" variant="cards" direction="vertical" />
      </div>
    `,
  }),
};

/**
 * A11y - akadálymentességi variáns (aria attribútumok, billentyűzet navigáció)
 */
export const A11y: Story = {
  render: () => ({
    props: {
      schoolOptions,
      classOptions,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <ps-select
          label="Kötelező mező"
          emptyLabel="Válassz..."
          [options]="schoolOptions"
          [required]="true"
          fieldId="a11y-required-select"
        />
        <ps-select
          label="Hibás mező"
          emptyLabel="Válassz..."
          [options]="schoolOptions"
          errorMessage="A kiválasztás kötelező."
          [required]="true"
          fieldId="a11y-error-select"
        />
        <ps-select
          label="Segítő szöveggel"
          emptyLabel="Válassz osztályt..."
          [options]="classOptions"
          hint="A letiltott osztályokat nem lehet kiválasztani."
          fieldId="a11y-hint-select"
        />
        <p style="font-size: 0.875rem; color: #64748b; margin-top: 8px;">
          Tipp: Használd a nyilakat (↑↓) a navigációhoz, Enter/Space a kiválasztáshoz, Escape a bezáráshoz.
        </p>
      </div>
    `,
  }),
};
