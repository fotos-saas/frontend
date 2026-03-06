import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsTextareaComponent } from './ps-textarea.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsTextarea
 *
 * Tobbsoros szovegbeviteli mezo. Tamogatja a karakter szamlalot,
 * automatikus magassag igazitast es maximum karakter korlatot.
 */

@Component({
  selector: 'storybook-ps-textarea-host',
  standalone: true,
  imports: [PsTextareaComponent, FormsModule],
  template: `
    <ps-textarea
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [size]="size()"
      [state]="state()"
      [rows]="rows()"
      [maxLength]="maxLength()"
      [autoResize]="autoResize()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Ertek: {{ value }}</p>
  `,
})
class PsTextareaHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly rows = input(4);
  readonly maxLength = input(0);
  readonly autoResize = input(false);
  value = '';
}

const meta: Meta<PsTextareaHostComponent> = {
  title: 'Shared/Forms/PsTextarea',
  component: PsTextareaHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsTextareaHostComponent>;

export const Default: Story = {
  args: {
    label: 'Leiras',
    placeholder: 'Ird le a projektet...',
    hint: 'Rovid leiras a projektrol',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: { ...args, value: 'Ez egy minta szoveg a textarea-ban. A komponens tobbsoros szoveg bevitelre alkalmas.' },
    template: `
      <storybook-ps-textarea-host
        [label]="label"
        [placeholder]="placeholder"
        [rows]="rows"
        [maxLength]="maxLength"
      />
    `,
    moduleMetadata: { imports: [PsTextareaHostComponent] },
  }),
  args: {
    label: 'Megjegyzes',
    placeholder: 'Ird be a megjegyzest...',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Rendszer uzenet',
    placeholder: 'Nem szerkesztheto...',
    disabled: true,
  },
};

export const WithMaxLength: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Irj magadrol par sort...',
    maxLength: 200,
    hint: 'Maximum 200 karakter',
  },
};

export const AutoResize: Story = {
  args: {
    label: 'Megjegyzes',
    placeholder: 'Irj annyit amennyit szeretnel, a mezo automatikusan novekszik...',
    autoResize: true,
    rows: 2,
  },
};

export const WithError: Story = {
  args: {
    label: 'Leiras',
    placeholder: 'Kotelezo mezo...',
    errorMessage: 'A leiras kitoltese kotelezo',
    required: true,
  },
};
