import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsDatepickerComponent } from './ps-datepicker.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsDatepicker
 *
 * Datumvalaszto komponens magyar naptar nezettel.
 * Tamogatja a min/max datum korlátokat, a ma gomb kivalasztast
 * es a billentyuzet navigaciot.
 */

@Component({
  selector: 'storybook-ps-datepicker-host',
  standalone: true,
  imports: [PsDatepickerComponent, FormsModule],
  template: `
    <ps-datepicker
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [min]="min()"
      [max]="max()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Valasztott datum: {{ value }}</p>
  `,
})
class PsDatepickerHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly min = input('');
  readonly max = input('');
  value = '';
}

const meta: Meta<PsDatepickerHostComponent> = {
  title: 'Shared/Forms/PsDatepicker',
  component: PsDatepickerHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsDatepickerHostComponent>;

export const Default: Story = {
  args: {
    label: 'Szuletesi datum',
    placeholder: 'Valassz datumot...',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: { ...args, value: '2026-03-06' },
    template: `
      <storybook-ps-datepicker-host
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [min]="min"
        [max]="max"
      />
    `,
    moduleMetadata: { imports: [PsDatepickerHostComponent] },
  }),
  args: {
    label: 'Projekt kezdete',
    placeholder: 'Valassz datumot...',
    hint: 'A projekt tervezett indulasa',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Regisztracio datuma',
    placeholder: 'Nem modosithato',
    disabled: true,
  },
};

export const WithMinMax: Story = {
  args: {
    label: 'Foglalasi datum',
    placeholder: 'Valassz datumot...',
    min: '2026-01-01',
    max: '2026-12-31',
    hint: 'Csak 2026-os datumokat valaszthatsz',
  },
};

export const WithError: Story = {
  args: {
    label: 'Hatarido',
    placeholder: 'Valassz datumot...',
    errorMessage: 'A hatarido megadasa kotelezo',
    required: true,
  },
};

export const SmallSize: Story = {
  args: {
    label: 'Datum',
    placeholder: 'Valassz...',
    size: 'sm',
  },
};
