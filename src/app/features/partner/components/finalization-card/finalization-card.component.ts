import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinalizationListItem } from '../../models/partner.models';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-finalization-card',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, MatTooltipModule, FormsModule],
  templateUrl: './finalization-card.component.html',
  styleUrl: './finalization-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalizationCardComponent {
  readonly ICONS = ICONS;

  readonly item = input.required<FinalizationListItem>();

  readonly cardClick = output<FinalizationListItem>();
  readonly downloadClick = output<FinalizationListItem>();
  readonly uploadClick = output<FinalizationListItem>();
  readonly tabloSizeChange = output<{ item: FinalizationListItem; size: string }>();

  editingSize = signal(false);
  sizeValue = signal('');

  onDownloadClick(event: MouseEvent): void {
    event.stopPropagation();
    this.downloadClick.emit(this.item());
  }

  onUploadClick(event: MouseEvent): void {
    event.stopPropagation();
    this.uploadClick.emit(this.item());
  }

  startEditSize(event: MouseEvent): void {
    event.stopPropagation();
    this.sizeValue.set(this.item().tabloSize ?? '');
    this.editingSize.set(true);
  }

  saveSize(): void {
    const newSize = this.sizeValue().trim();
    if (newSize !== (this.item().tabloSize ?? '')) {
      this.tabloSizeChange.emit({ item: this.item(), size: newSize });
    }
    this.editingSize.set(false);
  }

  cancelEditSize(): void {
    this.editingSize.set(false);
  }

  onSizeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveSize();
    } else if (event.key === 'Escape') {
      this.cancelEditSize();
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
