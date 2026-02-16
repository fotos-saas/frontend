import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinalizationListItem, TabloSize } from '../../models/partner.models';
import { PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { ICONS } from '../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-finalization-card',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, MatTooltipModule, FormsModule, PsSelectComponent],
  templateUrl: './finalization-card.component.html',
  styleUrl: './finalization-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalizationCardComponent {
  readonly ICONS = ICONS;

  readonly item = input.required<FinalizationListItem>();
  readonly availableSizes = input<TabloSize[]>([]);

  readonly cardClick = output<FinalizationListItem>();
  readonly downloadClick = output<FinalizationListItem>();
  readonly uploadClick = output<FinalizationListItem>();
  readonly tabloSizeChange = output<{ item: FinalizationListItem; size: string }>();

  readonly sizeOptions = computed<PsSelectOption[]>(() =>
    this.availableSizes().map(s => ({ id: s.value, label: s.label }))
  );

  onDownloadClick(event: MouseEvent): void {
    event.stopPropagation();
    this.downloadClick.emit(this.item());
  }

  onUploadClick(event: MouseEvent): void {
    event.stopPropagation();
    this.uploadClick.emit(this.item());
  }

  onSizeSelected(value: string | number): void {
    const size = String(value);
    if (size !== (this.item().tabloSize ?? '')) {
      this.tabloSizeChange.emit({ item: this.item(), size });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
