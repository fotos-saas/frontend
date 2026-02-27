import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDetailData } from '../project-detail.types';
import { BackButtonComponent } from '../../../components/action-buttons';
import { ICONS } from '../../../constants/icons.constants';
import { StatusDropdownComponent } from '../../status-dropdown/status-dropdown.component';

@Component({
  selector: 'app-project-detail-header',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, MatTooltipModule, BackButtonComponent, StatusDropdownComponent],
  templateUrl: './project-detail-header.component.html',
  styleUrl: './project-detail-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailHeaderComponent {
  readonly ICONS = ICONS;

  readonly project = input<ProjectDetailData | null>(null);
  readonly loading = input<boolean>(false);
  readonly isMarketer = input<boolean>(false);
  readonly showTabloEditor = input<boolean>(false);

  readonly back = output<void>();
  readonly editProject = output<void>();
  readonly deleteProject = output<void>();
  readonly downloadSelections = output<void>();
  readonly openTabloEditor = output<void>();
  readonly statusChange = output<{ value: string; label: string; color: string }>();

  readonly hasGallery = computed(() => !!this.project()?.tabloGalleryId);
  readonly idCopied = signal(false);

  copyId(): void {
    const id = this.project()?.id;
    if (!id) return;
    navigator.clipboard.writeText(String(id)).then(() => {
      this.idCopied.set(true);
      setTimeout(() => this.idCopied.set(false), 1500);
    });
  }

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
