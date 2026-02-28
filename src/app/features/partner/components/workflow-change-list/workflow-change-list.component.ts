import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { WorkflowChange } from '../../models/workflow.models';

@Component({
  selector: 'app-workflow-change-list',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './workflow-change-list.component.html',
  styleUrl: './workflow-change-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowChangeListComponent {
  changes = input.required<WorkflowChange[]>();
  readonly ICONS = ICONS;

  getChangeTypeLabel(type: string): string {
    switch (type) {
      case 'added': return 'Új';
      case 'changed': return 'Módosított';
      case 'removed': return 'Eltávolított';
      default: return type;
    }
  }

  getChangeTypeClass(type: string): string {
    switch (type) {
      case 'added': return 'change--added';
      case 'changed': return 'change--changed';
      case 'removed': return 'change--removed';
      default: return '';
    }
  }
}
