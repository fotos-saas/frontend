import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsTagInputComponent } from './ps-tag-input.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsTagInput
 *
 * Cimke beviteli komponens. A felhasznalo Enter-rel vagy elvalaszto karakterrel
 * adhat hozza uj cimkeket. Tamogatja a maximum cimke szamot es a duplikatum szurest.
 */

@Component({
  selector: 'storybook-ps-tag-input-host',
  standalone: true,
  imports: [PsTagInputComponent, FormsModule],
  template: `
    <ps-tag-input
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [maxTags]="maxTags()"
      [allowDuplicates]="allowDuplicates()"
      [separator]="separator()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Cimkek: {{ value | json }}</p>
  `,
})
class PsTagInputHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly maxTags = input(0);
  readonly allowDuplicates = input(false);
  readonly separator = input(',');
  value: string[] = [];
}

const meta: Meta<PsTagInputHostComponent> = {
  title: 'Shared/Forms/PsTagInput',
  component: PsTagInputHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsTagInputHostComponent>;

export const Default: Story = {
  args: {
    label: 'Cimkek',
    placeholder: 'Adj hozza cimkeket (Enter)...',
    hint: 'Nyomj Enter-t vagy vesszot a hozzaadashoz',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: { ...args, value: ['portrefoto', 'tablofotozas', 'iskola', 'csoportkep'] },
    template: `
      <storybook-ps-tag-input-host
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [maxTags]="maxTags"
      />
    `,
    moduleMetadata: { imports: [PsTagInputHostComponent] },
  }),
  args: {
    label: 'Kulcsszavak',
    placeholder: 'Uj kulcsszo...',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Kategoriak',
    placeholder: 'Nem modosithato...',
    disabled: true,
  },
};

export const MaxTags: Story = {
  args: {
    label: 'Cimkek',
    placeholder: 'Max 5 cimke...',
    maxTags: 5,
    hint: 'Legfeljebb 5 cimket adhatsz hozza',
  },
};

export const WithError: Story = {
  args: {
    label: 'Cimkek',
    placeholder: 'Adj hozza cimkeket...',
    errorMessage: 'Legalabb egy cimke megadasa kotelezo',
    required: true,
  },
};
