import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { WorkflowStatus, WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from '../../models/workflow.models';

@Component({
  selector: 'app-workflow-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="wf-badge" [ngClass]="'wf-badge--' + color()">
      {{ label() }}
    </span>
  `,
  styles: [`
    .wf-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .wf-badge--gray { background: #f3f4f6; color: #6b7280; }
    .wf-badge--blue { background: #dbeafe; color: #1d4ed8; }
    .wf-badge--amber { background: #fef3c7; color: #b45309; }
    .wf-badge--green { background: #d1fae5; color: #065f46; }
    .wf-badge--red { background: #fee2e2; color: #b91c1c; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowStatusBadgeComponent {
  status = input.required<WorkflowStatus>();

  label = () => WORKFLOW_STATUS_LABELS[this.status()] ?? this.status();
  color = () => WORKFLOW_STATUS_COLORS[this.status()] ?? 'gray';
}
