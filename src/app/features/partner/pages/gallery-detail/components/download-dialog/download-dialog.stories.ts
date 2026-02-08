import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, X, Download } from 'lucide-angular';
import { DownloadDialogComponent, DownloadOptions } from './download-dialog.component';
import { action } from '@storybook/addon-actions';

const meta: Meta<DownloadDialogComponent> = {
  title: 'Partner/DownloadDialog',
  component: DownloadDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ X, Download })],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj<DownloadDialogComponent>;

/** Default - Alapértelmezett beállítások */
export const Default: Story = {
  render: () => ({
    props: {
      defaults: {},
      onDownload: action('download'),
      onClose: action('close'),
    },
    template: `
      <app-download-dialog
        [defaults]="defaults"
        (download)="onDownload($event)"
        (close)="onClose()"
      />
    `,
  }),
};

/** WithDefaults - Előre kitöltött beállításokkal */
export const WithDefaults: Story = {
  render: () => ({
    props: {
      defaults: {
        zipContent: 'retouch_and_tablo',
        fileNaming: 'student_name',
      } as Partial<DownloadOptions>,
      onDownload: action('download'),
      onClose: action('close'),
    },
    template: `
      <app-download-dialog
        [defaults]="defaults"
        (download)="onDownload($event)"
        (close)="onClose()"
      />
    `,
  }),
};

/** RetouchOnly - Csak retusált képek */
export const RetouchOnly: Story = {
  render: () => ({
    props: {
      defaults: {
        zipContent: 'retouch_only',
        fileNaming: 'student_name_iptc',
      } as Partial<DownloadOptions>,
      onDownload: action('download'),
      onClose: action('close'),
    },
    template: `
      <app-download-dialog
        [defaults]="defaults"
        (download)="onDownload($event)"
        (close)="onClose()"
      />
    `,
  }),
};

/** DarkMode - Sötét háttéren */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    props: {
      defaults: {},
      onDownload: action('download'),
      onClose: action('close'),
    },
    template: `
      <app-download-dialog
        [defaults]="defaults"
        (download)="onDownload($event)"
        (close)="onClose()"
      />
    `,
  }),
};
