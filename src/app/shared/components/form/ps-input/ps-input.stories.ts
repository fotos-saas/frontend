import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Component, input } from '@angular/core';
import { PsInputComponent } from './ps-input.component';
import { PsInputType, PsFieldSize, PsFieldState, PsHelpItem } from '../form.types';

/**
 * ## PsInput
 *
 * Egysoros szöveg beviteli mezo. Tamogatja a kulonbozo tipusokat (text, email, password, number, tel, url),
 * prefix/suffix szoveget, allapot jelzest es help popover-t.
 */

@Component({
  selector: 'storybook-ps-input-host',
  standalone: true,
  imports: [PsInputComponent, FormsModule],
  template: `
    <ps-input
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [size]="size()"
      [state]="state()"
      [type]="type()"
      [prefix]="prefix()"
      [suffix]="suffix()"
      [helpItems]="helpItems()"
      [helpTitle]="helpTitle()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Ertek: {{ value }}</p>
  `,
})
class PsInputHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly type = input<PsInputType>('text');
  readonly prefix = input('');
  readonly suffix = input('');
  readonly helpItems = input<PsHelpItem[]>([]);
  readonly helpTitle = input('');
  value = '';
}

const meta: Meta<PsInputHostComponent> = {
  title: 'Shared/Forms/PsInput',
  component: PsInputHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsInputHostComponent>;

export const Default: Story = {
  args: {
    label: 'Felhasznalonev',
    placeholder: 'Ird be a felhasznaloneved...',
    hint: 'Legalabb 3 karakter',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: {
      ...args,
      value: 'Kiss Peter',
    },
    template: `
      <storybook-ps-input-host
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [type]="type"
        [prefix]="prefix"
        [suffix]="suffix"
        [state]="state"
        [errorMessage]="errorMessage"
        [required]="required"
        [disabled]="disabled"
        [readonly]="readonly"
        [size]="size"
      />
    `,
    moduleMetadata: {
      imports: [PsInputHostComponent],
    },
  }),
  args: {
    label: 'Nev',
    placeholder: 'Ird be a neved...',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Email cim',
    placeholder: 'pelda@email.hu',
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email cim',
    placeholder: 'pelda@email.hu',
    type: 'email',
    errorMessage: 'Ervenytelen email cim formatum',
    required: true,
  },
};

export const Password: Story = {
  args: {
    label: 'Jelszo',
    placeholder: 'Ird be a jelszavad...',
    type: 'password',
    required: true,
  },
};

export const WithPrefix: Story = {
  args: {
    label: 'Weboldal',
    placeholder: 'pelda.hu',
    prefix: 'https://',
    type: 'url',
  },
};

export const WithSuffix: Story = {
  args: {
    label: 'Suly',
    placeholder: '0',
    suffix: 'kg',
    type: 'number',
  },
};

export const PhoneInput: Story = {
  args: {
    label: 'Telefonszam',
    placeholder: '+36 30 123 4567',
    type: 'tel',
  },
};

export const SuccessState: Story = {
  args: {
    label: 'Felhasznalonev',
    placeholder: 'Ird be a felhasznaloneved...',
    state: 'success',
    hint: 'Ez a felhasznalonev elerheto',
  },
};

export const Readonly: Story = {
  args: {
    label: 'API kulcs',
    readonly: true,
  },
};

export const SmallSize: Story = {
  args: {
    label: 'Kod',
    placeholder: 'ABC',
    size: 'sm',
  },
};

export const WithHelp: Story = {
  args: {
    label: 'Keresesi kifejezes',
    placeholder: 'Ird be a keresest...',
    helpTitle: 'Keresesi sugó',
    helpItems: [
      { syntax: '#123', description: 'Projekt ID keresese' },
      { syntax: '@nev', description: 'Felhasznalo keresese nev alapjan' },
      { syntax: 'from:email', description: 'Feladó szerinti szures' },
    ],
  },
};
