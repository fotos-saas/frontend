import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchWorkflowType, BATCH_WORKFLOW_LABELS } from '../../models/batch.types';
import { PartnerProjectListItem } from '../../models/partner.models';
import { ElectronService } from '@core/services/electron.service';

/**
 * Batch Add Dropdown — kis dropdown a projekt lista sorain.
 * Művelet választás → kosárba.
 */
@Component({
  selector: 'app-batch-add-dropdown',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './batch-add-dropdown.component.html',
  styleUrl: './batch-add-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class BatchAddDropdownComponent {
  readonly ICONS = ICONS;
  readonly project = input.required<PartnerProjectListItem>();
  private readonly workspaceService = inject(BatchWorkspaceService);
  private readonly electronService = inject(ElectronService);

  readonly isElectron = this.electronService.isElectron;
  readonly open = signal(false);

  readonly workflowOptions: { type: BatchWorkflowType; label: string }[] = [
    { type: 'generate-psd', label: BATCH_WORKFLOW_LABELS['generate-psd'] },
    { type: 'generate-sample', label: BATCH_WORKFLOW_LABELS['generate-sample'] },
    { type: 'finalize', label: BATCH_WORKFLOW_LABELS['finalize'] },
  ];

  toggle(event: Event): void {
    event.stopPropagation();
    this.open.update(v => !v);
  }

  addToCart(type: BatchWorkflowType, event: Event): void {
    event.stopPropagation();
    this.workspaceService.addTask(this.project(), type);
    this.open.set(false);
  }

  onDocumentClick(event: Event): void {
    this.open.set(false);
  }
}
