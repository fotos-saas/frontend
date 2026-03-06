import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsSelectComponent } from './ps-select.component';
import { PsSelectOption, PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsSelect
 *
 * Legorduló valaszto komponens. Tamogatja a dropdown es cards varianst,
 * billentyuzet navigaciot es az overlay pozicionalast.
 */

@Component({
  selector: 'storybook-ps-select-host',
  standalone: true,
  imports: [PsSelectComponent, FormsModule],
  template: `
    <ps-select
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [options]="options()"
      [emptyLabel]="emptyLabel()"
      [variant]="variant()"
      [direction]="direction()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Valasztott ertek: {{ value }}</p>
  `,
})
class PsSelectHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly options = input<PsSelectOption[]>([]);
  readonly emptyLabel = input('Valassz...');
  readonly variant = input<'dropdown' | 'cards'>('dropdown');
  readonly direction = input<'horizontal' | 'vertical'>('horizontal');
  value = '';
}

const meta: Meta<PsSelectHostComponent> = {
  title: 'Shared/Forms/PsSelect',
  component: PsSelectHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsSelectHostComponent>;

const MEGYE_OPTIONS: PsSelectOption[] = [
  { id: 'bp', label: 'Budapest' },
  { id: 'pest', label: 'Pest megye' },
  { id: 'borsod', label: 'Borsod-Abauj-Zemplen megye' },
  { id: 'hajdu', label: 'Hajdu-Bihar megye' },
  { id: 'baranya', label: 'Baranya megye' },
  { id: 'bekes', label: 'Bekes megye' },
  { id: 'csongrad', label: 'Csongrad-Csanad megye' },
];

export const Default: Story = {
  args: {
    label: 'Megye',
    placeholder: 'Valassz megyet...',
    options: MEGYE_OPTIONS,
  },
};

export const WithSelected: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <storybook-ps-select-host
        [label]="label"
        [options]="options"
        [hint]="hint"
      />
    `,
    moduleMetadata: { imports: [PsSelectHostComponent] },
  }),
  args: {
    label: 'Megye',
    options: MEGYE_OPTIONS,
    hint: 'Valaszd ki a megyet ahol dolgozol',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Megye',
    options: MEGYE_OPTIONS,
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Megye',
    options: MEGYE_OPTIONS,
    errorMessage: 'Kotelezo mezo, kerlek valassz!',
    required: true,
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Csomag',
    options: [
      { id: 'alap', label: 'Alap csomag' },
      { id: 'iskola', label: 'Iskola csomag' },
      { id: 'studio', label: 'Studio csomag', disabled: true },
    ],
    hint: 'A Studio csomag jelenleg nem elerheto',
  },
};

export const CardsVariant: Story = {
  args: {
    label: 'Valassz fajl formatumot',
    variant: 'cards',
    direction: 'horizontal',
    options: [
      { id: 'jpg', label: 'JPG' },
      { id: 'png', label: 'PNG' },
      { id: 'webp', label: 'WebP' },
    ],
  },
};

export const SmallSize: Story = {
  args: {
    label: 'Szures',
    size: 'sm',
    options: [
      { id: 'all', label: 'Mind' },
      { id: 'active', label: 'Aktiv' },
      { id: 'archived', label: 'Archivalt' },
    ],
  },
};
