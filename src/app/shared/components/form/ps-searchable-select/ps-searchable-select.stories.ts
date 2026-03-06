import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsSearchableSelectComponent } from './ps-searchable-select.component';
import { PsSelectOption, PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsSearchableSelect
 *
 * Kereses funkciovel rendelkezo legorduló valaszto.
 * Idealis hosszu listak szuresehez. Tamogatja a torolheto erteket,
 * az "osszes" lehetoseget es a billentyuzet navigaciot.
 */

@Component({
  selector: 'storybook-ps-searchable-select-host',
  standalone: true,
  imports: [PsSearchableSelectComponent, FormsModule],
  template: `
    <ps-searchable-select
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [options]="options()"
      [clearable]="clearable()"
      [allLabel]="allLabel()"
      [searchPlaceholder]="searchPlaceholder()"
      [noResultsText]="noResultsText()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Valasztott: {{ value }}</p>
  `,
})
class PsSearchableSelectHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly options = input<PsSelectOption[]>([]);
  readonly clearable = input(false);
  readonly allLabel = input('');
  readonly searchPlaceholder = input('Kereses...');
  readonly noResultsText = input('Nincs talalat');
  value: string | number = '';
}

const meta: Meta<PsSearchableSelectHostComponent> = {
  title: 'Shared/Forms/PsSearchableSelect',
  component: PsSearchableSelectHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsSearchableSelectHostComponent>;

const ISKOLA_OPTIONS: PsSelectOption[] = [
  { id: 1, label: 'Petofi Sandor Altalanos Iskola', sublabel: 'Budapest' },
  { id: 2, label: 'Kossuth Lajos Gimnazium', sublabel: 'Debrecen' },
  { id: 3, label: 'Arany Janos Altalanos Iskola', sublabel: 'Szeged' },
  { id: 4, label: 'Moricz Zsigmond Gimnazium', sublabel: 'Miskolc' },
  { id: 5, label: 'Jozsef Attila Altalanos Iskola', sublabel: 'Pecs' },
  { id: 6, label: 'Ady Endre Gimnazium', sublabel: 'Gyor' },
  { id: 7, label: 'Bartok Bela Zeneiskola', sublabel: 'Kecskemet' },
  { id: 8, label: 'Kodaly Zoltan Altalanos Iskola', sublabel: 'Szekesfehervar' },
];

export const Default: Story = {
  args: {
    label: 'Iskola',
    placeholder: 'Valassz iskolat...',
    options: ISKOLA_OPTIONS,
    searchPlaceholder: 'Iskola keresese...',
  },
};

export const WithSelected: Story = {
  render: (args) => ({
    props: { ...args, value: 2 },
    template: `
      <storybook-ps-searchable-select-host
        [label]="label"
        [placeholder]="placeholder"
        [options]="options"
        [clearable]="clearable"
        [hint]="hint"
      />
    `,
    moduleMetadata: { imports: [PsSearchableSelectHostComponent] },
  }),
  args: {
    label: 'Iskola',
    options: ISKOLA_OPTIONS,
    clearable: true,
    hint: 'A kivalasztott iskola modosithato',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Iskola',
    options: ISKOLA_OPTIONS,
    disabled: true,
  },
};

export const WithAllOption: Story = {
  args: {
    label: 'Iskola szuro',
    options: ISKOLA_OPTIONS,
    allLabel: 'Osszes iskola',
    hint: 'Valaszd ki az "osszes" lehetoseget az osszes iskola megjelenitesere',
  },
};

export const Clearable: Story = {
  args: {
    label: 'Iskola',
    options: ISKOLA_OPTIONS,
    clearable: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Iskola',
    placeholder: 'Valassz iskolat...',
    options: ISKOLA_OPTIONS,
    errorMessage: 'Az iskola megadasa kotelezo',
    required: true,
  },
};
