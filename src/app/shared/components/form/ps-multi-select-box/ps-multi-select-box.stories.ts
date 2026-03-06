import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsMultiSelectBoxComponent } from './ps-multi-select-box.component';
import { PsSelectOption, PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsMultiSelectBox
 *
 * Tobbes valaszto lista (checkbox lista) dobozban.
 * Tamogatja a keresest, maximum magassagot es a letiltott opciókat.
 * Legordulo nelkul, mindig latható listaként jelenik meg.
 */

@Component({
  selector: 'storybook-ps-multi-select-box-host',
  standalone: true,
  imports: [PsMultiSelectBoxComponent, FormsModule],
  template: `
    <ps-multi-select-box
      [label]="label()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [options]="options()"
      [maxHeight]="maxHeight()"
      [searchable]="searchable()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Kivalasztva: {{ value | json }}</p>
  `,
})
class PsMultiSelectBoxHostComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly options = input<PsSelectOption[]>([]);
  readonly maxHeight = input('200px');
  readonly searchable = input(false);
  value: (string | number)[] = [];
}

const meta: Meta<PsMultiSelectBoxHostComponent> = {
  title: 'Shared/Forms/PsMultiSelectBox',
  component: PsMultiSelectBoxHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsMultiSelectBoxHostComponent>;

const OSZTALY_OPTIONS: PsSelectOption[] = [
  { id: '1a', label: '1.A osztaly' },
  { id: '1b', label: '1.B osztaly' },
  { id: '2a', label: '2.A osztaly' },
  { id: '2b', label: '2.B osztaly' },
  { id: '3a', label: '3.A osztaly' },
  { id: '3b', label: '3.B osztaly' },
  { id: '4a', label: '4.A osztaly' },
  { id: '4b', label: '4.B osztaly' },
  { id: '5a', label: '5.A osztaly' },
  { id: '5b', label: '5.B osztaly' },
];

export const Default: Story = {
  args: {
    label: 'Osztalyok',
    options: OSZTALY_OPTIONS,
    hint: 'Jelold be a resztvevo osztalyokat',
  },
};

export const WithSelected: Story = {
  render: (args) => ({
    props: { ...args, value: ['1a', '2a', '3a'] },
    template: `
      <storybook-ps-multi-select-box-host
        [label]="label"
        [options]="options"
        [searchable]="searchable"
        [hint]="hint"
        [maxHeight]="maxHeight"
      />
    `,
    moduleMetadata: { imports: [PsMultiSelectBoxHostComponent] },
  }),
  args: {
    label: 'Osztalyok',
    options: OSZTALY_OPTIONS,
    hint: '3 osztaly kivalasztva',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Osztalyok',
    options: OSZTALY_OPTIONS,
    disabled: true,
  },
};

export const Searchable: Story = {
  args: {
    label: 'Osztalyok',
    options: OSZTALY_OPTIONS,
    searchable: true,
    hint: 'Irj be szoveget a szureshez',
  },
};

export const CustomHeight: Story = {
  args: {
    label: 'Osztalyok',
    options: OSZTALY_OPTIONS,
    maxHeight: '300px',
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Osztalyok',
    options: [
      { id: '1a', label: '1.A osztaly' },
      { id: '1b', label: '1.B osztaly', disabled: true },
      { id: '2a', label: '2.A osztaly' },
      { id: '2b', label: '2.B osztaly', disabled: true },
    ],
    hint: 'A letiltott osztalyokhoz nincs hozzaferesi jogod',
  },
};

export const WithError: Story = {
  args: {
    label: 'Osztalyok',
    options: OSZTALY_OPTIONS,
    errorMessage: 'Legalabb egy osztalyt ki kell valasztani',
    required: true,
  },
};
