import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

export type SelectionPersonType = 'student' | 'teacher' | 'both';
export type SelectionFileNaming = 'original' | 'student_name';

export interface SelectionDownloadResult {
  personType: SelectionPersonType;
  fileNaming: SelectionFileNaming;
}

@Component({
  selector: 'app-selection-download-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './selection-download-dialog.component.html',
  styleUrl: './selection-download-dialog.component.scss',
})
export class SelectionDownloadDialogComponent {
  readonly download = output<SelectionDownloadResult>();
  readonly close = output<void>();

  readonly ICONS = ICONS;
  readonly selectedType = signal<SelectionPersonType>('both');
  readonly selectedNaming = signal<SelectionFileNaming>('student_name');

  selectType(type: SelectionPersonType): void {
    this.selectedType.set(type);
  }

  selectNaming(naming: SelectionFileNaming): void {
    this.selectedNaming.set(naming);
  }

  onSubmit(): void {
    this.download.emit({
      personType: this.selectedType(),
      fileNaming: this.selectedNaming(),
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
