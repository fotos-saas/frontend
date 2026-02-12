import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDetailData } from '../project-detail.types';
import { BackButtonComponent } from '../../../components/action-buttons';
import { ICONS } from '../../../constants/icons.constants';

@Component({
  selector: 'app-project-detail-header',
  standalone: true,
  imports: [NgClass, DatePipe, LucideAngularModule, MatTooltipModule, BackButtonComponent],
  templateUrl: './project-detail-header.component.html',
  styleUrl: './project-detail-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailHeaderComponent {
  readonly ICONS = ICONS;

  readonly project = input<ProjectDetailData | null>(null);
  readonly isMarketer = input<boolean>(false);

  readonly back = output<void>();
  readonly editProject = output<void>();
  readonly deleteProject = output<void>();

  getStatusIcon(status: string | null): string {
    const iconMap: Record<string, string> = {
      'not_started': ICONS.CIRCLE,
      'should_finish': ICONS.CLOCK,
      'waiting_for_response': ICONS.MAIL,
      'done': ICONS.CHECK,
      'waiting_for_finalization': ICONS.FILE_CHECK,
      'in_print': ICONS.PRINTER,
      'waiting_for_photos': ICONS.CAMERA,
      'got_response': ICONS.MAIL_CHECK,
      'needs_forwarding': ICONS.FORWARD,
      'at_teacher_for_finalization': ICONS.USER_CHECK,
      'needs_call': ICONS.PHONE,
      'sos_waiting_for_photos': ICONS.ALERT_TRIANGLE,
      'push_could_be_done': ICONS.ARROW_RIGHT,
    };
    return iconMap[status ?? ''] ?? ICONS.CIRCLE;
  }
}
