import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { RichTextEditorComponent } from './rich-text-editor.component';
import { QuillModule } from 'ngx-quill';

const meta: Meta<RichTextEditorComponent> = {
  title: 'Shared/Content/RichTextEditor',
  component: RichTextEditorComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [RichTextEditorComponent, FormsModule, QuillModule],
    }),
  ],
  argTypes: {
    mode: {
      control: 'select',
      options: ['basic', 'standard', 'full'],
      description: 'Editor mód',
    },
    placeholder: { control: 'text', description: 'Placeholder szöveg' },
    maxLength: { control: 'number', description: 'Maximum karakter szám' },
    minHeight: { control: 'number', description: 'Minimum magasság (px)' },
    maxHeight: { control: 'number', description: 'Maximum magasság (px)' },
  },
};

export default meta;
type Story = StoryObj<RichTextEditorComponent>;

/** Alapértelmezett - standard mód */
export const Default: Story = {
  args: {
    mode: 'standard',
    placeholder: 'Írd ide a szöveget...',
    minHeight: 120,
    maxHeight: 400,
  },
};

/** Alap mód - minimális toolbar */
export const AlapMod: Story = {
  args: {
    mode: 'basic',
    placeholder: 'Rövid hozzászólás...',
    minHeight: 80,
    maxHeight: 200,
  },
};

/** Teljes mód - minden funkcióval */
export const TeljesMod: Story = {
  args: {
    mode: 'full',
    placeholder: 'Részletes szöveg formázási lehetőségekkel...',
    minHeight: 200,
    maxHeight: 600,
  },
};

/** Karakterlimittel */
export const Karakterlimittel: Story = {
  args: {
    mode: 'standard',
    placeholder: 'Maximum 500 karakter...',
    maxLength: 500,
    minHeight: 120,
    maxHeight: 300,
  },
};

/** Kis méretű - kommentekhez */
export const KisMeretu: Story = {
  args: {
    mode: 'basic',
    placeholder: 'Komment...',
    minHeight: 60,
    maxHeight: 150,
  },
};
