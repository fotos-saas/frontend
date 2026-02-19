import { Component, ChangeDetectionStrategy, input, output, effect, inject, ElementRef, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectDetailData } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';
import { formatFileSize } from '@shared/utils/formatters.util';
import {
  ProjectPrintTabStateService,
  PrintFileType,
  PrintFileUploadEvent,
  PrintFileDeleteEvent,
  PrintFileDownloadEvent,
} from './project-print-tab-state.service';

export { PrintFileType, PrintFileUploadEvent, PrintFileDeleteEvent, PrintFileDownloadEvent };

@Component({
  selector: 'app-project-print-tab',
  standalone: true,
  imports: [LucideAngularModule, DatePipe],
  providers: [ProjectPrintTabStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-print-tab.component.html',
  styleUrl: './project-print-tab.component.scss',
})
export class ProjectPrintTabComponent {
  readonly ICONS = ICONS;
  readonly state = inject(ProjectPrintTabStateService);

  readonly project = input<ProjectDetailData | null>(null);
  readonly downloadClick = output<PrintFileDownloadEvent>();
  readonly uploadFile = output<PrintFileUploadEvent>();
  readonly deleteClick = output<PrintFileDeleteEvent>();

  readonly smallTabloInput = viewChild<ElementRef<HTMLInputElement>>('smallTabloInputRef');
  readonly flatInput = viewChild<ElementRef<HTMLInputElement>>('flatInputRef');

  constructor() {
    effect(() => {
      const p = this.project();
      this.state.updateMimeTypes(
        p?.printSmallTablo?.mimeType,
        p?.printFlat?.mimeType,
      );
    });
  }

  onDragOver(event: DragEvent, type: PrintFileType): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.setDragging(type, true);
  }

  onDragLeave(event: DragEvent, type: PrintFileType): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.setDragging(type, false);
  }

  onDrop(event: DragEvent, type: PrintFileType): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.resetDragging();
    const file = event.dataTransfer?.files?.[0];
    if (file && this.state.processFile(file)) {
      this.uploadFile.emit({ file, type });
    }
  }

  onFileSelected(event: Event, type: PrintFileType): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.state.processFile(file)) {
      this.uploadFile.emit({ file, type });
    }
    input.value = '';
  }

  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}
