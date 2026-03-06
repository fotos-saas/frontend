import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchWorkflowType } from '../../models/batch.types';
import { createBackdropHandler } from '@shared/utils/dialog.util';

export interface BatchActionChoice {
  type: BatchWorkflowType;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-batch-action-dialog',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './batch-action-dialog.component.html',
  styleUrl: './batch-action-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class BatchActionDialogComponent {
  readonly ICONS = ICONS;

  readonly selectedCount = input.required<number>();
  readonly availableActions = input.required<BatchActionChoice[]>();

  readonly close = output<void>();
  readonly actionSelected = output<BatchWorkflowType>();

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  selectAction(type: BatchWorkflowType): void {
    this.actionSelected.emit(type);
  }
}
