import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsTimepickerComponent } from './ps-timepicker.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsTimepicker
 *
 * Idopontvalaszto komponens ora es perc kerekeknel.
 * Tamogatja a perclepcso beallitast, a "most" gyorsgombot
 * es a billentyuzet navigaciot.
 */

@Component({
  selector: 'storybook-ps-timepicker-host',
  standalone: true,
  imports: [PsTimepickerComponent, FormsModule],
  template: `
    <ps-timepicker
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [minuteStep]="minuteStep()"
      [(ngModel)]="value"
    />
    <p style="margin-top: 12px; color: #64748b; font-size: 13px;">Valasztott ido: {{ value }}</p>
  `,
})
class PsTimepickerHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly minuteStep = input(1);
  value = '';
}

const meta: Meta<PsTimepickerHostComponent> = {
  title: 'Shared/Forms/PsTimepicker',
  component: PsTimepickerHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsTimepickerHostComponent>;

export const Default: Story = {
  args: {
    label: 'Idopont',
    placeholder: 'Valassz idopontot...',
    hint: 'Valaszd ki a kezdesi idopontot',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: { ...args, value: '09:30' },
    template: `
      <storybook-ps-timepicker-host
        [label]="label"
        [placeholder]="placeholder"
        [hint]="hint"
        [minuteStep]="minuteStep"
      />
    `,
    moduleMetadata: { imports: [PsTimepickerHostComponent] },
  }),
  args: {
    label: 'Kezdes ideje',
    hint: 'Beallitott ido: 9:30',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Idopont',
    placeholder: 'Nem modosithato...',
    disabled: true,
  },
};

export const FifteenMinuteStep: Story = {
  args: {
    label: 'Idopont foglalás',
    placeholder: 'Valassz idopontot...',
    minuteStep: 15,
    hint: '15 perces lepcsoben valaszthatsz',
  },
};

export const ThirtyMinuteStep: Story = {
  args: {
    label: 'Eloadas kezdete',
    placeholder: 'Valassz...',
    minuteStep: 30,
    hint: '30 perces lepcsoben',
  },
};

export const WithError: Story = {
  args: {
    label: 'Erkezesi ido',
    placeholder: 'Valassz idopontot...',
    errorMessage: 'Az idopont megadasa kotelezo',
    required: true,
  },
};

export const SmallSize: Story = {
  args: {
    label: 'Ido',
    placeholder: 'Valassz...',
    size: 'sm',
  },
};
