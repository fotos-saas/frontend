import { Component, ChangeDetectionStrategy, inject, input, output, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';
import { BatchPortraitActionsService, BatchPhase, BatchPersonResult } from './batch-portrait-actions.service';

@Component({
  selector: 'app-batch-portrait-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './batch-portrait-dialog.component.html',
  styleUrl: './batch-portrait-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BatchPortraitActionsService],
})
export class BatchPortraitDialogComponent implements OnInit {
  readonly ICONS = ICONS;

  readonly persons = input.required<TabloPersonItem[]>();
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly completed = output<{ successful: number; failed: number }>();

  readonly batchActions = inject(BatchPortraitActionsService);

  // Proxy-k a template-hez
  readonly phase = this.batchActions.phase;
  readonly progress = this.batchActions.progress;
  readonly currentStep = this.batchActions.currentStep;
  readonly results = this.batchActions.results;

  ngOnInit(): void {
    this.startProcessing();
  }

  private async startProcessing(): Promise<void> {
    const result = await this.batchActions.processAll(this.persons(), this.projectId());
    this.completed.emit(result);
  }

  onClose(): void {
    this.close.emit();
  }

  getPhaseIcon(phase: BatchPhase): string {
    switch (phase) {
      case 'downloading': return this.ICONS.DOWNLOAD;
      case 'processing': return this.ICONS.SCAN_FACE;
      case 'uploading': return this.ICONS.UPLOAD;
      case 'done': return this.ICONS.CHECK_CIRCLE;
      case 'error': return this.ICONS.X_CIRCLE;
      default: return this.ICONS.LOADER;
    }
  }

  readonly phaseSteps: BatchPhase[] = ['downloading', 'processing', 'uploading'];

  getPhaseLabel(phase: BatchPhase | string): string {
    switch (phase) {
      case 'downloading': return 'Letöltés';
      case 'processing': return 'Feldolgozás';
      case 'uploading': return 'Feltöltés';
      case 'done': return 'Kész';
      case 'error': return 'Hiba';
      default: return 'Várakozás';
    }
  }

  get successCount(): number {
    return this.results().filter(r => r.success).length;
  }

  get failCount(): number {
    return this.results().filter(r => !r.success).length;
  }

  get isDone(): boolean {
    return this.phase() === 'done' || this.phase() === 'error';
  }

  getPhaseOrder(phase: string): number {
    const order: Record<string, number> = { idle: 0, downloading: 1, processing: 2, uploading: 3, done: 4, error: 4 };
    return order[phase] ?? 0;
  }
}
