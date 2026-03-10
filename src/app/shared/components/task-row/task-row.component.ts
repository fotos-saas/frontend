import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
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
  answerClicked = output<void>();
  edit = output<void>();
  delete = output<void>();

  readonly ICONS = ICONS;
  readonly getFileTypeIcon = getFileTypeIcon;
  readonly formatAttachmentSize = formatAttachmentSize;

  /** Típus alapú ikon */
  typeIcon = computed(() => {
    const type = this.task().type ?? 'task';
    switch (type) {
      case 'question': return ICONS.MESSAGE_CIRCLE_QUESTION;
      case 'note': return ICONS.STICKY_NOTE;
      default: return null; // feladatnál checkbox marad
    }
  });

  /** Checkbox aria-label típus alapján */
  toggleLabel = computed(() => {
    const type = this.task().type ?? 'task';
    const done = this.task().is_completed;
    switch (type) {
      case 'question': return done ? 'Visszavonás' : 'Megválaszolva jelölés';
      case 'note': return done ? 'Visszavonás' : 'Elintézve jelölés';
      default: return done ? 'Visszavonás' : 'Kész jelölés';
    }
  });
}
