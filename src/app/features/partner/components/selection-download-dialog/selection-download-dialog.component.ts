import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

export type SelectionPersonType = 'student' | 'teacher' | 'both';

@Component({
  selector: 'app-selection-download-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './selection-download-dialog.component.html',
  styleUrl: './selection-download-dialog.component.scss',
})
export class SelectionDownloadDialogComponent {
  readonly download = output<SelectionPersonType>();
  readonly close = output<void>();

  readonly ICONS = ICONS;
  readonly selectedType = signal<SelectionPersonType>('both');

  backdropHandler = createBackdropHandler(() => this.close.emit());

  selectType(type: SelectionPersonType): void {
    this.selectedType.set(type);
  }

  onSubmit(): void {
    this.download.emit(this.selectedType());
  }
}
