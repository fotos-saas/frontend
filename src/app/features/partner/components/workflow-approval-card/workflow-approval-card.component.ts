import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { WorkflowDetail, WorkflowApprovalData } from '../../models/workflow.models';

@Component({
  selector: 'app-workflow-approval-card',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './workflow-approval-card.component.html',
  styleUrl: './workflow-approval-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowApprovalCardComponent {
  workflow = input.required<WorkflowDetail>();
  canApproveHere = input(true);

  approve = output<{ notes?: string }>();
  reject = output<{ reason: string }>();

  readonly ICONS = ICONS;

  showRejectForm = signal(false);
  rejectReason = signal('');
  approveNotes = signal('');
  isSubmitting = signal(false);

  approvalData = computed<WorkflowApprovalData | null>(() => this.workflow().approval_data);
  summary = computed(() => this.approvalData()?.summary ?? '');
  emailDraft = computed(() => this.approvalData()?.email_draft ?? null);
  sampleUrl = computed(() => this.approvalData()?.sample_url ?? null);
  isAwaitingApproval = computed(() => this.workflow().status === 'awaiting_approval');

  onApprove(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const notes = this.approveNotes().trim() || undefined;
    this.approve.emit({ notes });
  }

  onReject(): void {
    const reason = this.rejectReason().trim();
    if (!reason || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.reject.emit({ reason });
  }

  toggleRejectForm(): void {
    this.showRejectForm.update(v => !v);
  }

  /** Szülő komponens hívja hiba esetén */
  resetSubmitting(): void {
    this.isSubmitting.set(false);
  }
}
