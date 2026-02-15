import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../../shared/utils/dialog.util';
import { PsSelectComponent, PsRadioGroupComponent, PsCheckboxComponent } from '@shared/components/form';
import { PsSelectOption, PsRadioOption } from '@shared/components/form/form.types';

export interface DownloadOptions {
  zipContent: 'retouch_only' | 'tablo_only' | 'all' | 'retouch_and_tablo';
  fileNaming: 'original' | 'student_name' | 'student_name_iptc';
  includeExcel: boolean;
}

@Component({
  selector: 'app-download-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, PsSelectComponent, PsRadioGroupComponent, PsCheckboxComponent],
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

  readonly zipContentOptions: PsSelectOption[] = [
    { id: 'all', label: 'Összes kép (saját + retusált + tablókép)' },
    { id: 'retouch_and_tablo', label: 'Retusált + Tablókép' },
    { id: 'retouch_only', label: 'Csak retusált képek' },
    { id: 'tablo_only', label: 'Csak tablókép' },
  ];

  readonly fileNamingOptions: PsRadioOption[] = [
    { value: 'original', label: 'Eredeti fájlnév', sublabel: 'pl. BG7A5017.JPG' },
    { value: 'student_name', label: 'Diák neve', sublabel: 'pl. Kiss Anna_retusalt_01.jpg' },
    { value: 'student_name_iptc', label: 'IPTC beágyazás', sublabel: 'Eredeti fájlnév, IPTC-ben a diák neve' },
  ];

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
}
