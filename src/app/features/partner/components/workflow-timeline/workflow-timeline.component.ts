import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { WorkflowStep, WORKFLOW_STEP_LABELS } from '../../models/workflow.models';

@Component({
  selector: 'app-workflow-timeline',
  standalone: true,
  imports: [NgClass, DatePipe, LucideAngularModule],
  templateUrl: './workflow-timeline.component.html',
  styleUrl: './workflow-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTimelineComponent {
  steps = input.required<WorkflowStep[]>();
  readonly ICONS = ICONS;

  getStepLabel(key: string): string {
    return WORKFLOW_STEP_LABELS[key] ?? key;
  }

  getStepIcon(status: string): string {
    switch (status) {
      case 'completed': return ICONS.CHECK_CIRCLE;
      case 'running': return ICONS.LOADER;
      case 'failed': return ICONS.X_CIRCLE;
      case 'skipped': return ICONS.MINUS_CIRCLE;
      default: return ICONS.CIRCLE;
    }
  }

  getStepColor(status: string): string {
    switch (status) {
      case 'completed': return 'step--completed';
      case 'running': return 'step--running';
      case 'failed': return 'step--failed';
      case 'skipped': return 'step--skipped';
      default: return 'step--pending';
    }
  }

  getExecutorLabel(executor: string): string {
    return executor === 'electron' ? 'Asztali alkalmazás' : 'Szerver';
  }
}
