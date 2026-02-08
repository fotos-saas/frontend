import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../../shared/utils/dialog.util';

export interface DownloadOptions {
  zipContent: 'retouch_only' | 'tablo_only' | 'all' | 'retouch_and_tablo';
  fileNaming: 'original' | 'student_name' | 'student_name_iptc';
  includeExcel: boolean;
}

@Component({
  selector: 'app-download-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './download-dialog.component.html',
  styleUrl: './download-dialog.component.scss',
})
export class DownloadDialogComponent {
  defaults = input<Partial<DownloadOptions>>({});

  readonly download = output<DownloadOptions>();
  readonly close = output<void>();

  readonly ICONS = ICONS;

  readonly zipContent = signal<DownloadOptions['zipContent']>('all');
  readonly fileNaming = signal<DownloadOptions['fileNaming']>('original');
  readonly includeExcel = signal<boolean>(true);

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    const d = this.defaults();
    if (d.zipContent) this.zipContent.set(d.zipContent);
    if (d.fileNaming) this.fileNaming.set(d.fileNaming);
    if (d.includeExcel !== undefined) this.includeExcel.set(d.includeExcel);
  }

  onSubmit(): void {
    this.download.emit({
      zipContent: this.zipContent(),
      fileNaming: this.fileNaming(),
      includeExcel: this.includeExcel(),
    });
  }

  onZipContentChange(event: Event): void {
    this.zipContent.set((event.target as HTMLSelectElement).value as DownloadOptions['zipContent']);
  }

  onFileNamingChange(value: DownloadOptions['fileNaming']): void {
    this.fileNaming.set(value);
  }

  onExcelToggle(): void {
    this.includeExcel.update(v => !v);
  }
}
