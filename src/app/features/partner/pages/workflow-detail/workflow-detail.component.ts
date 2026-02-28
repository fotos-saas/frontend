import { Component, signal, computed, inject, viewChild, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerWorkflowService } from '../../services/partner-workflow.service';
import { WorkflowDetail, WORKFLOW_TYPE_LABELS, WORKFLOW_STATUS_LABELS } from '../../models/workflow.models';
import { WorkflowStatusBadgeComponent } from '../../components/workflow-status-badge/workflow-status-badge.component';
import { WorkflowTimelineComponent } from '../../components/workflow-timeline/workflow-timeline.component';
import { WorkflowChangeListComponent } from '../../components/workflow-change-list/workflow-change-list.component';
import { WorkflowApprovalCardComponent } from '../../components/workflow-approval-card/workflow-approval-card.component';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [
    DatePipe,
    LucideAngularModule,
    WorkflowStatusBadgeComponent,
    WorkflowTimelineComponent,
    WorkflowChangeListComponent,
    WorkflowApprovalCardComponent,
  ],
  templateUrl: './workflow-detail.component.html',
  styleUrl: './workflow-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowDetailComponent implements OnInit {
  private workflowService = inject(PartnerWorkflowService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  private approvalCard = viewChild(WorkflowApprovalCardComponent);

  workflow = signal<WorkflowDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  typeLabel = computed(() => {
    const wf = this.workflow();
    return wf ? (WORKFLOW_TYPE_LABELS[wf.type] ?? wf.type) : '';
  });

  changes = computed(() => this.workflow()?.approval_data?.changes ?? []);
  canApproveHere = computed(() => {
    const wf = this.workflow();
    if (!wf) return false;
    return wf.approval_location === 'both' || wf.approval_location === 'web';
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/partner/workflows']);
      return;
    }
    this.loadWorkflow(id);
  }

  private loadWorkflow(id: number): void {
    this.loading.set(true);
    this.workflowService.getWorkflow(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wf) => {
          this.workflow.set(wf);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('A munkafolyamat nem található.');
          this.loading.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/partner/workflows']);
  }

  onApprove(event: { notes?: string }): void {
    const wf = this.workflow();
    if (!wf) return;

    this.workflowService.approveWorkflow(wf.id, event)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.workflow.set(updated),
        error: () => {
          this.error.set('A jóváhagyás sikertelen.');
          this.approvalCard()?.resetSubmitting();
        },
      });
  }

  onReject(event: { reason: string }): void {
    const wf = this.workflow();
    if (!wf) return;

    this.workflowService.rejectWorkflow(wf.id, event)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.workflow.set(updated),
        error: () => {
          this.error.set('Az elutasítás sikertelen.');
          this.approvalCard()?.resetSubmitting();
        },
      });
  }
}
