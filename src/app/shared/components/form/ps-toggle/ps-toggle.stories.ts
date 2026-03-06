import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsToggleComponent } from './ps-toggle.component';
import { PsFieldSize } from '../form.types';

/**
 * ## PsToggle
 *
 * Kapcsolo (toggle switch) komponens boolean ertekekhez.
 * Tamogatja a label pozicionalast (elotte/utana) es a billentyuzet kezelest.
 */

@Component({
  selector: 'storybook-ps-toggle-host',
  standalone: true,
  imports: [PsToggleComponent, FormsModule],
  template: `
    <ps-toggle
      [label]="label()"
      [hint]="hint()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [labelPosition]="labelPosition()"
      [size]="size()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Ertek: {{ value }}</p>
  `,
})
class PsToggleHostComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly labelPosition = input<'before' | 'after'>('after');
  readonly size = input<PsFieldSize>('full');
  value = false;
}

const meta: Meta<PsToggleHostComponent> = {
  title: 'Shared/Forms/PsToggle',
  component: PsToggleHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsToggleHostComponent>;

export const Default: Story = {
  args: {
    label: 'Ertesitesek engedelyezese',
    hint: 'Email ertesiteseket kapsz uj esemenyekrol',
  },
};

export const Selected: Story = {
  render: (args) => ({
    props: { ...args, value: true },
    template: `
      <storybook-ps-toggle-host
        [label]="label"
        [hint]="hint"
        [disabled]="disabled"
        [labelPosition]="labelPosition"
      />
    `,
    moduleMetadata: { imports: [PsToggleHostComponent] },
  }),
  args: {
    label: 'Sotet mod',
    hint: 'Az alkalmazas sotet temaban jelenik meg',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Karbantartas mod',
    hint: 'Ezt a beallitast csak admin modosithatja',
    disabled: true,
  },
};

export const LabelBefore: Story = {
  args: {
    label: 'Automatikus mentes',
    labelPosition: 'before',
  },
};

export const Readonly: Story = {
  args: {
    label: 'Ketfaktoros hitelesites',
    hint: 'A biztonsagi beallitasoknal kapcsolhato ki',
    readonly: true,
  },
};
