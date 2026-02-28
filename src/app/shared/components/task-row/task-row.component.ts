import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ICONS } from '../../constants/icons.constants';
import { getFileTypeIcon, formatAttachmentSize } from '../../utils/file-type-icon.util';
import type { ProjectTask } from '../../../features/partner/models/partner.models';

export type TaskRowSection = 'my_own' | 'assigned_to_me' | 'i_gave_others';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [LucideAngularModule, SafeHtmlPipe],
  templateUrl: './task-row.component.html',
  styleUrls: ['./task-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskRowComponent {
  task = input.required<ProjectTask>();
  section = input<TaskRowSection>('my_own');
  showActions = input(true);

  toggleComplete = output<void>();
  toggleReview = output<void>();
  edit = output<void>();
  delete = output<void>();

  readonly ICONS = ICONS;
  readonly getFileTypeIcon = getFileTypeIcon;
  readonly formatAttachmentSize = formatAttachmentSize;
}
