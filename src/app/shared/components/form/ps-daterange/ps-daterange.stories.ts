import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsDaterangeComponent, DateRange } from './ps-daterange.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsDaterange
 *
 * Datum tartomany valaszto, ket PsDatepicker-t kombinal (mikortol - meddig).
 * Automatikusan korlatozza a min/max ertekeket a masik mezo alapjan,
 * es torli a "meddig" erteket ha az uj "mikortol" kesobb van.
 */

@Component({
  selector: 'storybook-ps-daterange-host',
  standalone: true,
  imports: [PsDaterangeComponent, FormsModule],
  template: `
    <ps-daterange
      [label]="label()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [min]="min()"
      [max]="max()"
      [fromLabel]="fromLabel()"
      [toLabel]="toLabel()"
      [fromPlaceholder]="fromPlaceholder()"
      [toPlaceholder]="toPlaceholder()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">
      Tartomany: {{ value.from }} - {{ value.to }}
    </p>
  `,
})
class PsDaterangeHostComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly min = input('');
  readonly max = input('');
  readonly fromLabel = input('Mikortol');
  readonly toLabel = input('Meddig');
  readonly fromPlaceholder = input('Kezdo datum...');
  readonly toPlaceholder = input('Zaro datum...');
  value: DateRange = { from: '', to: '' };
}

const meta: Meta<PsDaterangeHostComponent> = {
  title: 'Shared/Forms/PsDaterange',
  component: PsDaterangeHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsDaterangeHostComponent>;

export const Default: Story = {
  args: {
    label: 'Idoszak',
    hint: 'Valaszd ki a kezdo es zaro datumot',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: {
      ...args,
      value: { from: '2026-03-01', to: '2026-03-31' },
    },
    template: `
      <storybook-ps-daterange-host
        [label]="label"
        [hint]="hint"
        [min]="min"
        [max]="max"
        [fromLabel]="fromLabel"
        [toLabel]="toLabel"
      />
    `,
    moduleMetadata: { imports: [PsDaterangeHostComponent] },
  }),
  args: {
    label: 'Jelentesi idoszak',
    hint: 'Marcius honap kivalasztva',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Idoszak',
    disabled: true,
  },
};

export const WithMinMax: Story = {
  args: {
    label: 'Tanev idoszaka',
    min: '2025-09-01',
    max: '2026-06-30',
    hint: 'A tanev idoszakan belul valaszthatsz',
  },
};

export const CustomLabels: Story = {
  args: {
    label: 'Nyari szunet',
    fromLabel: 'Elso nap',
    toLabel: 'Utolso nap',
    fromPlaceholder: 'Szunet kezdete...',
    toPlaceholder: 'Szunet vege...',
  },
};

export const WithError: Story = {
  args: {
    label: 'Idoszak',
    errorMessage: 'Az idoszak megadasa kotelezo',
    required: true,
  },
};
