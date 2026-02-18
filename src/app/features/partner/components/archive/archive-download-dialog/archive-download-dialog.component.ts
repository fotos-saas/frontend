import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsRadioGroupComponent } from '@shared/components/form';
import { PsRadioOption } from '@shared/components/form/form.types';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';

export type ArchiveFileNaming = 'original' | 'student_name' | 'student_name_iptc';

export interface ArchiveDownloadOptions {
  fileNaming: ArchiveFileNaming;
}

@Component({
  selector: 'app-archive-download-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, PsRadioGroupComponent, DialogWrapperComponent],
  templateUrl: './archive-download-dialog.component.html',
  styleUrl: './archive-download-dialog.component.scss',
})
export class ArchiveDownloadDialogComponent {
  readonly download = output<ArchiveDownloadOptions>();
  readonly close = output<void>();

  readonly ICONS = ICONS;

  readonly fileNaming = signal<ArchiveFileNaming>('student_name');

  readonly fileNamingOptions: PsRadioOption[] = [
    { value: 'original', label: 'Eredeti fájlnév', sublabel: 'pl. BG7A5017.JPG' },
    { value: 'student_name', label: 'Tanár neve', sublabel: 'pl. Kiss János.jpg' },
    { value: 'student_name_iptc', label: 'IPTC beágyazás', sublabel: 'Eredeti fájlnév, IPTC-ben a tanár neve' },
  ];

  onSubmit(): void {
    this.download.emit({ fileNaming: this.fileNaming() });
  }
}
