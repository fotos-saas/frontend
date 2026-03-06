import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsRadioGroupComponent } from './ps-radio-group.component';
import { PsRadioOption, PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsRadioGroup
 *
 * Radiokapcsolo csoport. Tamogatja a lista es kartya varianst,
 * vizszintes/fuggoleges irany es billentyuzet navigaciot.
 */

@Component({
  selector: 'storybook-ps-radio-group-host',
  standalone: true,
  imports: [PsRadioGroupComponent, FormsModule],
  template: `
    <ps-radio-group
      [label]="label()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [options]="options()"
      [direction]="direction()"
      [variant]="variant()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Valasztott ertek: {{ value }}</p>
  `,
})
class PsRadioGroupHostComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly options = input<PsRadioOption[]>([]);
  readonly direction = input<'horizontal' | 'vertical'>('vertical');
  readonly variant = input<'list' | 'cards'>('list');
  value: string | number = '';
}

const meta: Meta<PsRadioGroupHostComponent> = {
  title: 'Shared/Forms/PsRadioGroup',
  component: PsRadioGroupHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsRadioGroupHostComponent>;

const CSOMAG_OPTIONS: PsRadioOption[] = [
  { value: 'alap', label: 'Alap csomag', sublabel: '5 GB tarolo, 10 osztaly' },
  { value: 'iskola', label: 'Iskola csomag', sublabel: '100 GB tarolo, 20 osztaly' },
  { value: 'studio', label: 'Studio csomag', sublabel: '500 GB tarolo, korlatlan osztaly' },
];

export const Default: Story = {
  args: {
    label: 'Elofizetesi csomag',
    options: CSOMAG_OPTIONS,
    hint: 'Valaszd ki a szamodra megfelelo csomagot',
  },
};

export const WithSelected: Story = {
  render: (args) => ({
    props: { ...args, value: 'iskola' },
    template: `
      <storybook-ps-radio-group-host
        [label]="label"
        [options]="options"
        [direction]="direction"
        [variant]="variant"
        [hint]="hint"
      />
    `,
    moduleMetadata: { imports: [PsRadioGroupHostComponent] },
  }),
  args: {
    label: 'Elofizetesi csomag',
    options: CSOMAG_OPTIONS,
    hint: 'Jelenlegi csomagod: Iskola',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Elofizetesi csomag',
    options: CSOMAG_OPTIONS,
    disabled: true,
  },
};

export const Horizontal: Story = {
  args: {
    label: 'Fajl formatum',
    direction: 'horizontal',
    options: [
      { value: 'jpg', label: 'JPG' },
      { value: 'png', label: 'PNG' },
      { value: 'webp', label: 'WebP' },
    ],
  },
};

export const CardsVariant: Story = {
  args: {
    label: 'Fizetesi mod',
    variant: 'cards',
    options: [
      { value: 'card', label: 'Bankkartya', sublabel: 'Visa, Mastercard' },
      { value: 'transfer', label: 'Atutalas', sublabel: 'Banki atutalas' },
      { value: 'cash', label: 'Keszpenz', sublabel: 'Szemelyes fizetes' },
    ],
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Szallitasi mod',
    options: [
      { value: 'personal', label: 'Szemelyes atvetel' },
      { value: 'courier', label: 'Futarszolgalat', sublabel: 'GLS, DPD' },
      { value: 'post', label: 'Magyar Posta', disabled: true, sublabel: 'Ideiglenesen nem elerheto' },
    ],
  },
};

export const WithError: Story = {
  args: {
    label: 'Csomag valasztas',
    options: CSOMAG_OPTIONS,
    errorMessage: 'Kerlek valassz egy csomagot',
    required: true,
  },
};
