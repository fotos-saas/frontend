import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, argsToTemplate } from '@storybook/angular';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PsDatepickerComponent } from './ps-datepicker.component';
import { DropdownFlipDirective } from '@shared/directives';

const meta: Meta<PsDatepickerComponent> = {
  title: 'Form/PsDatepicker',
  component: PsDatepickerComponent,
  decorators: [
    moduleMetadata({
      imports: [NgClass, LucideAngularModule, DropdownFlipDirective],
    }),
  ],
  argTypes: {
    label: { control: 'text', description: 'Mező felirat' },
    placeholder: { control: 'text', description: 'Helykitöltő szöveg' },
    hint: { control: 'text', description: 'Segítő szöveg a mező alatt' },
    errorMessage: { control: 'text', description: 'Hibaüzenet' },
    required: { control: 'boolean', description: 'Kötelező mező' },
    disabled: { control: 'boolean', description: 'Letiltott állapot' },
    readonly: { control: 'boolean', description: 'Csak olvasható' },
    min: { control: 'text', description: 'Legkorábbi dátum (YYYY-MM-DD)' },
    max: { control: 'text', description: 'Legkésőbbi dátum (YYYY-MM-DD)' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'full'],
      description: 'Mező mérete',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Mező állapota',
    },
  },
  args: {
    label: 'Dátum',
    placeholder: 'Válassz dátumot...',
    hint: '',
    errorMessage: '',
    required: false,
    disabled: false,
    readonly: false,
    min: '',
    max: '',
    size: 'full',
    state: 'default',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="min-height: 420px;">
        <ps-datepicker
          ${argsToTemplate(args)}
        ></ps-datepicker>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<PsDatepickerComponent>;

/** Alapértelmezett dátumválasztó */
export const Default: Story = {};

/** Előre kitöltött dátummal */
export const WithValue: Story = {
  args: {
    label: 'Születési dátum',
    placeholder: 'Add meg a születésnapod...',
    hint: 'Magyar formátumban jelenik meg',
  },
  render: (args) => ({
    props: {
      ...args,
      initPicker(el: PsDatepickerComponent) {
        el.writeValue('2026-03-12');
      },
    },
    template: `
      <div style="min-height: 420px;">
        <ps-datepicker
          #pickerEl
          ${argsToTemplate(args)}
          [attr.data-init]="initPicker(pickerEl)"
        ></ps-datepicker>
      </div>
    `,
  }),
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    label: 'Lezárt dátum',
    placeholder: 'Nem választható',
    disabled: true,
  },
};

/** Sötét mód */
export const DarkMode: Story = {
  args: {
    label: 'Esemény dátuma',
    placeholder: 'Válassz dátumot...',
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="background: #1e1e2e; padding: 2rem; border-radius: 8px; min-height: 420px;">
        <ps-datepicker
          ${argsToTemplate(args)}
        ></ps-datepicker>
      </div>
    `,
  }),
};

/** Kötelező mező hibaüzenettel */
export const WithError: Story = {
  args: {
    label: 'Határidő',
    placeholder: 'Válassz dátumot...',
    required: true,
    errorMessage: 'A dátum megadása kötelező!',
    state: 'error',
  },
};

/** Dátum tartomány korlátozás (min/max) */
export const WithMinMax: Story = {
  args: {
    label: 'Foglalás dátuma',
    placeholder: 'Válassz egy elérhető napot...',
    min: '2026-03-01',
    max: '2026-03-31',
    hint: 'Csak 2026. március hónapban választhatsz',
  },
};

/** Kötelező mező segítő szöveggel */
export const RequiredWithHint: Story = {
  args: {
    label: 'Kezdés dátuma',
    placeholder: 'Válassz dátumot...',
    required: true,
    hint: 'A projekt indulásának dátuma',
  },
};

/** Kisebb méretű datepicker */
export const SmallSize: Story = {
  args: {
    label: 'Dátum',
    placeholder: 'Válassz...',
    size: 'md',
  },
};
