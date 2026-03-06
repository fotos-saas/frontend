import { Meta, StoryObj } from '@storybook/angular';
import { Component, input } from '@angular/core';
import { PsFileUploadComponent } from './ps-file-upload.component';
import { PsFieldSize, PsFieldState } from '../form.types';

/**
 * ## PsFileUpload
 *
 * Fajlfeltolto komponens drag & drop tamogatassal.
 * Tamogatja a tobbszoros feltoltest, kepelonezetet, fajlmeret/tipusellenorzest
 * es 3 megjelenesi varianst (default, compact, mini).
 *
 * **Megjegyzes:** A MediaLightbox fuggoseg miatt a lightbox funkcio
 * csak alkalmazas kontextusban mukodik.
 */

@Component({
  selector: 'storybook-ps-file-upload-host',
  standalone: true,
  imports: [PsFileUploadComponent],
  template: `
    <ps-file-upload
      [label]="label()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [required]="required()"
      [disabled]="disabled()"
      [size]="size()"
      [state]="state()"
      [accept]="accept()"
      [acceptLabel]="acceptLabel()"
      [maxFiles]="maxFiles()"
      [maxSizeMB]="maxSizeMB()"
      [multiple]="multiple()"
      [variant]="variant()"
      [dropzoneText]="dropzoneText()"
      [dropzoneHint]="dropzoneHint()"
      (uploadError)="onError($event)"
    />
    <p *ngIf="errorMsg" style="margin-top: 12px; color: #ef4444; font-size: 13px;">{{ errorMsg }}</p>
  `,
})
class PsFileUploadHostComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly accept = input('.jpg,.jpeg,.png,.webp');
  readonly acceptLabel = input('JPG, PNG, WebP');
  readonly maxFiles = input(10);
  readonly maxSizeMB = input(20);
  readonly multiple = input(true);
  readonly variant = input<'default' | 'compact' | 'mini'>('default');
  readonly dropzoneText = input('');
  readonly dropzoneHint = input('');
  errorMsg = '';

  onError(msg: string): void {
    this.errorMsg = msg;
  }
}

const meta: Meta<PsFileUploadHostComponent> = {
  title: 'Shared/Forms/PsFileUpload',
  component: PsFileUploadHostComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PsFileUploadHostComponent>;

export const Default: Story = {
  args: {
    label: 'Fotok feltoltese',
    hint: 'Huzd ide a fotokat vagy kattints a tallozashoz',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Fotok feltoltese',
    disabled: true,
  },
};

export const SingleFile: Story = {
  args: {
    label: 'Profilkep',
    multiple: false,
    maxSizeMB: 5,
    hint: 'Maximum 5 MB, csak egy kep toltheto fel',
  },
};

export const CompactVariant: Story = {
  args: {
    label: 'Dokumentumok',
    variant: 'compact',
    accept: '.pdf,.doc,.docx',
    acceptLabel: 'PDF, DOC',
    maxFiles: 5,
  },
};

export const MiniVariant: Story = {
  args: {
    label: 'Logo',
    variant: 'mini',
    multiple: false,
    maxSizeMB: 2,
  },
};

export const CustomDropzone: Story = {
  args: {
    label: 'Tablofotok',
    dropzoneText: 'Huzd ide a tablofotokat',
    dropzoneHint: 'JPEG vagy PNG, max. 50 MB / fajl, max. 30 kep',
    maxFiles: 30,
    maxSizeMB: 50,
  },
};

export const WithError: Story = {
  args: {
    label: 'Fotok feltoltese',
    errorMessage: 'Legalabb egy fotot fel kell tolteni',
    required: true,
  },
};
