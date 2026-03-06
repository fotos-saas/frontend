import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsEditorComponent, PsEditorMode } from './ps-editor.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsEditor
 *
 * Rich text szerkeszto (Quill alapu). Harom mod:
 * - **basic**: felkover, dolt, alahuzas, link
 * - **standard**: + lista, torlojel, clean
 * - **full**: + fejlecek, behuzas, idezet, kod blokk
 *
 * **Megjegyzes:** A Quill editor a Storybook-ban lassabban toltodhet be.
 */

@Component({
  selector: 'storybook-ps-editor-host',
  standalone: true,
  imports: [PsEditorComponent, FormsModule],
  template: `
    <ps-editor
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [mode]="mode()"
      [minHeight]="minHeight()"
      [maxHeight]="maxHeight()"
      [maxLength]="maxLength()"
      [(ngModel)]="value"
    />
    <details style="margin-top: 12px;">
      <summary style="color: #64748b; font-size: 13px; cursor: pointer;">HTML kimenet</summary>
      <pre style="font-size: 12px; color: #334155; background: #f1f5f9; padding: 8px; border-radius: 4px; overflow: auto;">{{ value }}</pre>
    </details>
  `,
})
class PsEditorHostComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly mode = input<PsEditorMode>('standard');
  readonly minHeight = input(0);
  readonly maxHeight = input(0);
  readonly maxLength = input(0);
  value = '';
}

const meta: Meta<PsEditorHostComponent> = {
  title: 'Shared/Forms/PsEditor',
  component: PsEditorHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsEditorHostComponent>;

export const Default: Story = {
  args: {
    label: 'Leiras',
    placeholder: 'Ird le a projektet reszletesen...',
    mode: 'standard',
  },
};

export const WithValue: Story = {
  render: (args) => ({
    props: {
      ...args,
      value: '<p><strong>Kedves Szulok!</strong></p><p>Ertesitjuk Onöket, hogy a <em>tablofotozas</em> idopontja:</p><ul><li>2026. marcius 15.</li><li>Helyszin: iskola tornaterem</li></ul>',
    },
    template: `
      <storybook-ps-editor-host
        [label]="label"
        [placeholder]="placeholder"
        [mode]="mode"
      />
    `,
    moduleMetadata: { imports: [PsEditorHostComponent] },
  }),
  args: {
    label: 'Ertesites szovege',
    mode: 'standard',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Leiras',
    disabled: true,
  },
};

export const BasicMode: Story = {
  args: {
    label: 'Rovid megjegyzes',
    placeholder: 'Irj egy rovid megjegyzest...',
    mode: 'basic',
    hint: 'Csak alapveto formazas elerheto',
  },
};

export const FullMode: Story = {
  args: {
    label: 'Cikk tartalma',
    placeholder: 'Ird meg a cikk tartalmat...',
    mode: 'full',
    hint: 'Teljes szerkeszto eszkoztar (fejlecek, listak, idezet, kod)',
  },
};

export const WithMaxLength: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Irj magadrol...',
    mode: 'basic',
    maxLength: 500,
    hint: 'Maximum 500 karakter',
  },
};

export const CustomHeight: Story = {
  args: {
    label: 'Hosszu tartalom',
    placeholder: 'Irj annyi szoveget amennyit szeretnel...',
    mode: 'standard',
    minHeight: 200,
    maxHeight: 600,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email sablon szovege',
    placeholder: 'Ird meg az email tartalmat...',
    mode: 'standard',
    errorMessage: 'Az email tartalom megadasa kotelezo',
    required: true,
  },
};
