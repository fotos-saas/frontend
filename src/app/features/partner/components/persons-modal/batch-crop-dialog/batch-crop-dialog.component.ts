import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';
import { BatchCropActionsService, CropPhase, CropReviewItem } from './batch-crop-actions.service';

@Component({
  selector: 'app-batch-crop-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent, ConfirmDialogComponent],
  templateUrl: './batch-crop-dialog.component.html',
  styleUrl: './batch-crop-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BatchCropActionsService],
})
export class BatchCropDialogComponent {
  readonly ICONS = ICONS;

  readonly persons = input.required<TabloPersonItem[]>();
  readonly projectId = input.required<number>();

  readonly close = output<void>();

  readonly batchActions = inject(BatchCropActionsService);

  readonly phase = this.batchActions.phase;
  readonly progress = this.batchActions.progress;
  readonly currentStep = this.batchActions.currentStep;
  readonly reviewItems = this.batchActions.reviewItems;
  readonly uploadResults = this.batchActions.uploadResults;
  readonly includedCount = this.batchActions.includedCount;
  readonly excludedCount = this.batchActions.excludedCount;
  readonly isClosable = this.batchActions.isClosable;
  readonly needsCloseConfirm = this.batchActions.needsCloseConfirm;

  readonly archiveMode = signal<'archive' | 'project_only' | null>(null);
  readonly showCloseConfirm = signal(false);

  readonly phaseSteps: CropPhase[] = ['downloading', 'detecting', 'cropping'];

  startProcessing(mode: 'archive' | 'project_only'): void {
    this.archiveMode.set(mode);
    this.batchActions.detectAndCrop(this.persons(), this.projectId());
  }

  onClose(): void {
    if (this.needsCloseConfirm()) {
      this.showCloseConfirm.set(true);
      return;
    }
    this.close.emit();
  }

  onConfirmClose(result: { action: 'confirm' | 'cancel' }): void {
    this.showCloseConfirm.set(false);
    if (result.action === 'confirm') {
      this.close.emit();
    }
  }

  toggleExclude(personId: number): void {
    this.batchActions.toggleExclude(personId);
  }

  uploadAccepted(): void {
    const mode = this.archiveMode() ?? 'archive';
    this.batchActions.uploadAccepted(this.projectId(), mode);
  }

  getPhaseLabel(phase: CropPhase | string): string {
    switch (phase) {
      case 'downloading': return 'Letöltés';
      case 'detecting': return 'Detektálás';
      case 'cropping': return 'Vágás';
      case 'review': return 'Átnézés';
      case 'uploading': return 'Feltöltés';
      case 'done': return 'Kész';
      case 'error': return 'Hiba';
      default: return 'Várakozás';
    }
  }

  getPhaseOrder(phase: string): number {
    const order: Record<string, number> = {
      idle: 0, downloading: 1, detecting: 2, cropping: 3, review: 4, uploading: 5, done: 6, error: 6,
    };
    return order[phase] ?? 0;
  }

  getQualityClass(item: CropReviewItem): string {
    if (!item.hasFace) return 'quality--bad';
    if (item.eyesClosed || item.isBlurry) return 'quality--warn';
    return 'quality--good';
  }

  getQualityLabel(item: CropReviewItem): string {
    if (!item.hasFace) return 'Nincs arc';
    if (item.eyesClosed) return 'Csukott szem';
    if (item.isBlurry) return 'Homályos';
    return 'Jó';
  }

  get successCount(): number {
    return this.uploadResults().filter(r => r.success).length;
  }

  get failCount(): number {
    return this.uploadResults().filter(r => !r.success).length;
  }

  get isDone(): boolean {
    return this.phase() === 'done' || this.phase() === 'error';
  }
}
