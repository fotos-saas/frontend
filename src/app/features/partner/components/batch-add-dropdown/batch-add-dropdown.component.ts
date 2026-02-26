import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchWorkflowType, BATCH_WORKFLOW_LABELS } from '../../models/batch.types';
import { PartnerProjectListItem } from '../../models/partner.models';
import { ElectronService } from '@core/services/electron.service';
import { PsdStatusService } from '../../services/psd-status.service';

/** Globális referencia az éppen nyitott dropdown-ra — egyszerre csak egy lehet */
let activeDropdown: BatchAddDropdownComponent | null = null;

/**
 * Batch Add Dropdown — kis dropdown a projekt lista sorain.
 * Művelet választás → kosárba.
 *
 * PSD státusz alapján szűri az opciókat:
 * - Nincs PSD → csak "PSD generálás"
 * - Van PSD → csak "Minta generálás" + "Véglegesítés"
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
  private readonly psdStatusService = inject(PsdStatusService);

  readonly isElectron = this.electronService.isElectron;
  readonly open = signal(false);

  /** Elérhető workflow opciók a PSD státusz alapján */
  readonly workflowOptions = computed(() => {
    const hasPsd = this.psdStatusService.getStatus(this.project().id)?.exists ?? false;

    const all: { type: BatchWorkflowType; label: string }[] = [
      { type: 'generate-psd', label: BATCH_WORKFLOW_LABELS['generate-psd'] },
      { type: 'generate-sample', label: BATCH_WORKFLOW_LABELS['generate-sample'] },
      { type: 'finalize', label: BATCH_WORKFLOW_LABELS['finalize'] },
    ];

    if (hasPsd) {
      return all.filter(o => o.type !== 'generate-psd');
    }
    return all.filter(o => o.type === 'generate-psd');
  });

  toggle(event: Event): void {
    event.stopPropagation();

    // Ha egy másik dropdown nyitva van, zárjuk be
    if (activeDropdown && activeDropdown !== this) {
      activeDropdown.open.set(false);
    }

    this.open.update(v => !v);
    activeDropdown = this.open() ? this : null;
  }

  addToCart(type: BatchWorkflowType, event: Event): void {
    event.stopPropagation();
    this.workspaceService.addTask(this.project(), type);
    this.open.set(false);
    activeDropdown = null;
  }

  onDocumentClick(event: Event): void {
    this.open.set(false);
    if (activeDropdown === this) {
      activeDropdown = null;
    }
  }
}
