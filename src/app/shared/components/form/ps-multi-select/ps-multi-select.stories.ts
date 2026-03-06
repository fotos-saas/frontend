import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsMultiSelectComponent } from './ps-multi-select.component';
import { PsSelectOption, PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsMultiSelect
 *
 * Tobbes valaszto komponens legorduloval es chip megjelenitovel.
 * Tamogatja a mind kivalasztasa funkciót, maximum kivalasztas szamot
 * es a chip-ek egyenkenti torloset.
 */

@Component({
  selector: 'storybook-ps-multi-select-host',
  standalone: true,
  imports: [PsMultiSelectComponent, FormsModule],
  template: `
    <ps-multi-select
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [options]="options()"
      [maxSelections]="maxSelections()"
      [chipDisplay]="chipDisplay()"
      [selectAllLabel]="selectAllLabel()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Kivalasztva: {{ value | json }}</p>
  `,
})
class PsMultiSelectHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly options = input<PsSelectOption[]>([]);
  readonly maxSelections = input(0);
  readonly chipDisplay = input(true);
  readonly selectAllLabel = input('Mind kivalasztasa');
  value: (string | number)[] = [];
}

const meta: Meta<PsMultiSelectHostComponent> = {
  title: 'Shared/Forms/PsMultiSelect',
  component: PsMultiSelectHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsMultiSelectHostComponent>;

const TANTARGY_OPTIONS: PsSelectOption[] = [
  { id: 'math', label: 'Matematika' },
  { id: 'hungarian', label: 'Magyar nyelv es irodalom' },
  { id: 'history', label: 'Tortenelem' },
  { id: 'biology', label: 'Biologia' },
  { id: 'physics', label: 'Fizika' },
  { id: 'chemistry', label: 'Kemia' },
  { id: 'english', label: 'Angol nyelv' },
  { id: 'german', label: 'Nemet nyelv' },
  { id: 'pe', label: 'Testneveles' },
  { id: 'it', label: 'Informatika' },
];

export const Default: Story = {
  args: {
    label: 'Tantargyak',
    placeholder: 'Valassz tantargyakat...',
    options: TANTARGY_OPTIONS,
  },
};

export const WithSelected: Story = {
  render: (args) => ({
    props: { ...args, value: ['math', 'hungarian', 'english'] },
    template: `
      <storybook-ps-multi-select-host
        [label]="label"
        [placeholder]="placeholder"
        [options]="options"
        [chipDisplay]="chipDisplay"
        [hint]="hint"
      />
    `,
    moduleMetadata: { imports: [PsMultiSelectHostComponent] },
  }),
  args: {
    label: 'Tantargyak',
    options: TANTARGY_OPTIONS,
    hint: '3 tantargy kivalasztva',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Tantargyak',
    options: TANTARGY_OPTIONS,
    disabled: true,
  },
};

export const MaxSelections: Story = {
  args: {
    label: 'Kedvenc tantargyak',
    placeholder: 'Valassz maximum 3-at...',
    options: TANTARGY_OPTIONS,
    maxSelections: 3,
    hint: 'Maximum 3 tantargyat valaszthatsz',
  },
};

export const NoChipDisplay: Story = {
  args: {
    label: 'Szurok',
    options: TANTARGY_OPTIONS,
    chipDisplay: false,
    hint: 'A kivalasztott elemek szama jelenik meg chipek helyett',
  },
};

export const WithError: Story = {
  args: {
    label: 'Tantargyak',
    placeholder: 'Valassz tantargyakat...',
    options: TANTARGY_OPTIONS,
    errorMessage: 'Legalabb egy tantargyat ki kell valasztani',
    required: true,
  },
};
