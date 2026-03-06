import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsCheckboxComponent } from './ps-checkbox.component';

/**
 * ## PsCheckbox
 *
 * Jeloloneyzet komponens boolean ertekekhez.
 * Tamogatja az indeterminate allapotot es a billentyuzet kezelest.
 */

@Component({
  selector: 'storybook-ps-checkbox-host',
  standalone: true,
  imports: [PsCheckboxComponent, FormsModule],
  template: `
    <ps-checkbox
      [label]="label()"
      [hint]="hint()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [indeterminate]="indeterminate()"
      [errorMessage]="errorMessage()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Ertek: {{ value }}</p>
  `,
})
class PsCheckboxHostComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly indeterminate = input(false);
  readonly errorMessage = input('');
  value = false;
}

const meta: Meta<PsCheckboxHostComponent> = {
  title: 'Shared/Forms/PsCheckbox',
  component: PsCheckboxHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsCheckboxHostComponent>;

export const Default: Story = {
  args: {
    label: 'Elfogadom a felhasznalasi felteteleket',
  },
};

export const Selected: Story = {
  render: (args) => ({
    props: { ...args, value: true },
    template: `
      <storybook-ps-checkbox-host
        [label]="label"
        [hint]="hint"
        [disabled]="disabled"
        [indeterminate]="indeterminate"
      />
    `,
    moduleMetadata: { imports: [PsCheckboxHostComponent] },
  }),
  args: {
    label: 'Feliratkozom a hirlevelre',
    hint: 'Heti osszefoglalot kapsz emailben',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Adatfeldolgozasi hozzajarulas',
    hint: 'Ez a hozzajarulas kotelezo',
    disabled: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Osszes kivalasztasa',
    indeterminate: true,
    hint: 'Nehany elem kivalasztva',
  },
};

export const WithError: Story = {
  args: {
    label: 'Elfogadom az altalanos szerzodesi felteteleket',
    errorMessage: 'A felteteleket el kell fogadni a tovabblepeshez',
  },
};
