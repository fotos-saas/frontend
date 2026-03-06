import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsCodeInputComponent } from './ps-code-input.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsCodeInput
 *
 * Numerikus kod beviteli mezo (pl. SMS hitelesiteshez, meghivo kodhoz).
 * Csak szamjegyeket fogad el, tamogatja a maszkolast (jelszo mod)
 * es a maximum hossz korlatozast.
 */

@Component({
  selector: 'storybook-ps-code-input-host',
  standalone: true,
  imports: [PsCodeInputComponent, FormsModule],
  template: `
    <ps-code-input
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [maxLength]="maxLength()"
      [masked]="masked()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Ertek: {{ value }}</p>
  `,
})
class PsCodeInputHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly maxLength = input(6);
  readonly masked = input(false);
  value = '';
}

const meta: Meta<PsCodeInputHostComponent> = {
  title: 'Shared/Forms/PsCodeInput',
  component: PsCodeInputHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsCodeInputHostComponent>;

export const Default: Story = {
  args: {
    label: 'Hitelesitesi kod',
    placeholder: '000000',
    hint: 'Ird be az SMS-ben kapott 6 jegyu kodot',
    maxLength: 6,
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: { ...args, value: '482917' },
    template: `
      <storybook-ps-code-input-host
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [maxLength]="maxLength"
        [masked]="masked"
      />
    `,
    moduleMetadata: { imports: [PsCodeInputHostComponent] },
  }),
  args: {
    label: 'Hitelesitesi kod',
    maxLength: 6,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Hitelesitesi kod',
    placeholder: '000000',
    disabled: true,
  },
};

export const Masked: Story = {
  args: {
    label: 'PIN kod',
    placeholder: '0000',
    maxLength: 4,
    masked: true,
    hint: 'A PIN kod rejtve marad',
  },
};

export const FourDigit: Story = {
  args: {
    label: 'Meghivo kod',
    placeholder: '0000',
    maxLength: 4,
  },
};

export const WithError: Story = {
  args: {
    label: 'Hitelesitesi kod',
    placeholder: '000000',
    maxLength: 6,
    errorMessage: 'Ervenytelen kod, probald ujra',
    required: true,
  },
};

export const SuccessState: Story = {
  args: {
    label: 'Hitelesitesi kod',
    placeholder: '000000',
    state: 'success',
    hint: 'Sikeres hitelesites',
  },
};
