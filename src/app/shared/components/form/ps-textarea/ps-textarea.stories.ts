import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, argsToTemplate } from '@storybook/angular';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PsTextareaComponent } from './ps-textarea.component';

const meta: Meta<PsTextareaComponent> = {
  title: 'Form/PsTextarea',
  component: PsTextareaComponent,
  decorators: [
    moduleMetadata({
      imports: [NgClass, LucideAngularModule],
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
    rows: { control: 'number', description: 'Sorok száma' },
    maxLength: { control: 'number', description: 'Maximális karakterszám' },
    autoResize: { control: 'boolean', description: 'Automatikus átméretezés' },
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
    label: 'Megjegyzés',
    placeholder: 'Írd ide a megjegyzésed...',
    hint: '',
    errorMessage: '',
    required: false,
    disabled: false,
    readonly: false,
    rows: 4,
    maxLength: 0,
    autoResize: false,
    size: 'full',
    state: 'default',
  },
  render: (args) => ({
    props: args,
    template: `
      <ps-textarea
        ${argsToTemplate(args)}
      ></ps-textarea>
    `,
  }),
};

export default meta;
type Story = StoryObj<PsTextareaComponent>;

/** Alapértelmezett textarea */
export const Default: Story = {};

/** Kitöltött textarea karakterszámlálóval */
export const WithValue: Story = {
  args: {
    label: 'Leírás',
    placeholder: 'Add meg a leírást...',
    maxLength: 200,
    hint: 'Maximum 200 karakter',
  },
  render: (args) => ({
    props: args,
    template: `
      <ps-textarea
        ${argsToTemplate(args)}
      ></ps-textarea>
    `,
  }),
};

/** Letiltott állapot */
export const Disabled: Story = {
  args: {
    label: 'Megjegyzés',
    placeholder: 'Ez a mező le van tiltva',
    disabled: true,
  },
};

/** Sötét mód */
export const DarkMode: Story = {
  args: {
    label: 'Megjegyzés',
    placeholder: 'Sötét módú textarea...',
    hint: 'Ez a mező sötét háttéren jelenik meg',
  },
  decorators: [
    (story) => ({
      ...story(),
      template: `
        <div style="background: #1e1e2e; padding: 2rem; border-radius: 8px;">
          ${story().template}
        </div>
      `,
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="background: #1e1e2e; padding: 2rem; border-radius: 8px;">
        <ps-textarea
          ${argsToTemplate(args)}
        ></ps-textarea>
      </div>
    `,
  }),
};

/** Kötelező mező hibaüzenettel */
export const WithError: Story = {
  args: {
    label: 'Kötelező megjegyzés',
    placeholder: 'Írd ide a megjegyzésed...',
    required: true,
    errorMessage: 'Ez a mező kötelező!',
    state: 'error',
  },
};

/** Sikeres állapot */
export const Success: Story = {
  args: {
    label: 'Megjegyzés',
    placeholder: 'Írd ide a megjegyzésed...',
    state: 'success',
    hint: 'Sikeresen mentve!',
  },
};

/** Csak olvasható mező */
export const ReadOnly: Story = {
  args: {
    label: 'Lezárt megjegyzés',
    placeholder: '',
    readonly: true,
  },
};

/** Automatikus méretezés */
export const AutoResize: Story = {
  args: {
    label: 'Automatikus méret',
    placeholder: 'Gépelés közben automatikusan nő...',
    autoResize: true,
    rows: 2,
  },
};

/** Karakterszámláló limittel */
export const WithCharacterLimit: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Írj magadról pár szót...',
    maxLength: 150,
    hint: 'Rövid bemutatkozás',
  },
};
