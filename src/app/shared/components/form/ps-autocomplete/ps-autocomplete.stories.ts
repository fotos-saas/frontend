import { Meta, StoryObj } from '@storybook/angular';
import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsAutocompleteComponent } from './ps-autocomplete.component';
import { PsSelectOption, PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsAutocomplete
 *
 * Automatikus kiegeszitesi mezo keresesi javaslatokkal.
 * A keresesi kimenet debounce-olva van, tamogatja a szabad szoveg es
 * kotott valasztas modot, toltesi allapotot es billentyuzet navigaciot.
 */

const MOCK_VAROS_OPTIONS: PsSelectOption[] = [
  { id: 'bp', label: 'Budapest' },
  { id: 'debrecen', label: 'Debrecen' },
  { id: 'szeged', label: 'Szeged' },
  { id: 'miskolc', label: 'Miskolc' },
  { id: 'pecs', label: 'Pecs' },
  { id: 'gyor', label: 'Gyor' },
  { id: 'nyiregyhaza', label: 'Nyiregyhaza' },
  { id: 'kecskemet', label: 'Kecskemet' },
  { id: 'szfvar', label: 'Szekesfehervar' },
  { id: 'szombathely', label: 'Szombathely' },
];

@Component({
  selector: 'storybook-ps-autocomplete-host',
  standalone: true,
  imports: [PsAutocompleteComponent, FormsModule],
  template: `
    <ps-autocomplete
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [suggestions]="filteredSuggestions()"
      [loading]="loading()"
      [minChars]="minChars()"
      [debounceMs]="debounceMs()"
      [allowFreeText]="allowFreeText()"
      (search)="onSearch($event)"
      (selected)="onSelected($event)"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Ertek: {{ value }}</p>
  `,
})
class PsAutocompleteHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly loading = input(false);
  readonly minChars = input(2);
  readonly debounceMs = input(300);
  readonly allowFreeText = input(true);
  readonly allSuggestions = input<PsSelectOption[]>(MOCK_VAROS_OPTIONS);

  filteredSuggestions = signal<PsSelectOption[]>([]);
  value = '';

  onSearch(query: string): void {
    const q = query.toLowerCase();
    const filtered = this.allSuggestions().filter(o =>
      o.label.toLowerCase().includes(q)
    );
    this.filteredSuggestions.set(filtered);
  }

  onSelected(option: PsSelectOption): void {
    // Story-ban nem kell kulon logika
  }
}

const meta: Meta<PsAutocompleteHostComponent> = {
  title: 'Shared/Forms/PsAutocomplete',
  component: PsAutocompleteHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsAutocompleteHostComponent>;

export const Default: Story = {
  args: {
    label: 'Varos',
    placeholder: 'Kezdj el gepelni...',
    hint: 'Legalabb 2 karakter utan jelennek meg javaslatok',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: { ...args, value: 'Budapest' },
    template: `
      <storybook-ps-autocomplete-host
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [allowFreeText]="allowFreeText"
      />
    `,
    moduleMetadata: { imports: [PsAutocompleteHostComponent] },
  }),
  args: {
    label: 'Varos',
    placeholder: 'Kezdj el gepelni...',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Varos',
    placeholder: 'Nem modosithato...',
    disabled: true,
  },
};

export const NoFreeText: Story = {
  args: {
    label: 'Varos',
    placeholder: 'Valassz a listabol...',
    allowFreeText: false,
    hint: 'Csak a listabol valaszthatsz',
  },
};

export const Loading: Story = {
  args: {
    label: 'Varos',
    placeholder: 'Kezdj el gepelni...',
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Varos',
    placeholder: 'Kezdj el gepelni...',
    errorMessage: 'A varos megadasa kotelezo',
    required: true,
  },
};

export const HighMinChars: Story = {
  args: {
    label: 'Keresesi kifejezes',
    placeholder: 'Irj be legalabb 3 karaktert...',
    minChars: 3,
    hint: 'Legalabb 3 karakter utan jelennek meg javaslatok',
  },
};
