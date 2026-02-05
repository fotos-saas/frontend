import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDetailData, ProjectContact, QrCode } from '../project-detail.types';
import {
  BackButtonComponent,
  QrButtonComponent,
  AddButtonComponent,
  EditButtonComponent,
  DeleteButtonComponent
} from '../../../components/action-buttons';
import { ICONS } from '../../../constants/icons.constants';

/**
 * Project Detail View - Közös presentational (dumb) komponens.
 * Mind a Marketer, mind a Partner felület használhatja.
 * Nem tartalmaz service inject-et, csak Input/Output-okat.
 */
@Component({
  selector: 'app-project-detail-view',
  standalone: true,
  imports: [
    NgClass,
    LucideAngularModule,
    MatTooltipModule,
    BackButtonComponent,
    QrButtonComponent,
    AddButtonComponent,
    EditButtonComponent,
    DeleteButtonComponent,
  ],
  templateUrl: './project-detail-view.component.html',
  styleUrl: './project-detail-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailViewComponent {
  /** ICONS konstansok a template-hez */
  readonly ICONS = ICONS;

  // Inputs - Signal-based (Angular 17+)
  readonly project = input<ProjectDetailData | null>(null);
  readonly loading = input<boolean>(true);
  readonly isMarketer = input<boolean>(false);

  // Outputs - Signal-based (Angular 17+)
  readonly back = output<void>();
  readonly openQrModal = output<void>();
  readonly openContactModal = output<ProjectContact | null>();
  readonly deleteContact = output<ProjectContact>();
  readonly qrCodeChanged = output<QrCode | null>();
  readonly editProject = output<void>();
  readonly deleteProject = output<void>();
  readonly openOrderData = output<void>();

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /** QR kód kép URL generálása */
  getQrCodeImageUrl(registrationUrl: string): string {
    const url = encodeURIComponent(registrationUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${url}`;
  }

  /** Dátum formázás (rövid, idő nélkül) */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /** Státusz ikon */
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

  /** Név iniciálék lekérése (avatar-hoz) */
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
