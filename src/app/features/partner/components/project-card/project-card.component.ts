import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerProjectListItem } from '../../services/partner.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { StatusDropdownComponent } from '../../../../shared/components/status-dropdown/status-dropdown.component';

/**
 * Partner Project Card - Projekt sor a fotós felületen.
 * Lista nézet - soronként egy projekt.
 */
@Component({
  selector: 'app-partner-project-card',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, MatTooltipModule, StatusDropdownComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCardComponent {
  readonly ICONS = ICONS;
  private authService = inject(AuthService);
  readonly isMarketer = this.authService.isMarketer;

  readonly project = input.required<PartnerProjectListItem>();

  readonly cardClick = output<PartnerProjectListItem>();
  readonly samplesClick = output<PartnerProjectListItem>();
  readonly missingClick = output<PartnerProjectListItem>();
  readonly qrClick = output<PartnerProjectListItem>();
  readonly awareClick = output<PartnerProjectListItem>();
  readonly photosUploadedClick = output<PartnerProjectListItem>();
  readonly orderDataClick = output<PartnerProjectListItem>();
  readonly deleteClick = output<PartnerProjectListItem>();
  readonly linkClick = output<PartnerProjectListItem>();
  readonly statusChangeClick = output<{ projectId: number; status: string; label: string; color: string }>();

  /** Látható címkék (max 2) */
  readonly visibleTags = computed(() => (this.project().tags ?? []).slice(0, 2));

  /** Extra címkék száma */
  readonly extraTagCount = computed(() => Math.max(0, (this.project().tags ?? []).length - 2));

  /** Extra címkék tooltip */
  readonly extraTagsTooltip = computed(() => (this.project().tags ?? []).slice(2).map(t => t.name).join(', '));

  /**
   * Email badge tooltip szöveg
   */
  readonly emailTooltip = computed(() => {
    const metrics = this.project().emailMetrics;
    if (!metrics || metrics.unansweredCount === 0) return '';
    const parts = [`${metrics.unansweredCount} megválaszolatlan`];
    if (metrics.avgResponseHours !== null) {
      parts.push(`Átl. válaszidő: ~${Math.round(metrics.avgResponseHours)} óra`);
    }
    return parts.join(' · ');
  });

  /**
   * Email badge CSS class a válaszidő státusz alapján
   */
  readonly emailBadgeClass = computed(() => {
    const status = this.project().emailMetrics?.responseStatus;
    return status ? `email-badge--${status}` : 'email-badge--good';
  });

  /**
   * Rövidített státusz címke a badge-hez
   */
  getShortStatusLabel(label: string): string {
    const shortLabels: Record<string, string> = {
      'Nincs elkezdve': 'Új',
      'Be kellene fejeznem': 'Befejezni',
      'Válaszra várok': 'Várok',
      'Kész': 'Kész',
      'Véglegesítésre várok': 'Véglegesít',
      'Nyomdában': 'Nyomda',
      'Képekre várok': 'Képek!',
      'Kaptam választ': 'Válasz',
      'Tovább kell küldeni': 'Küldeni',
      'Osztályfőnöknél véglegesítésen': 'Ofo-nál',
      'Fel kell hívni, mert nem válaszol': 'Hívni!',
      'SOS képekre vár': 'SOS!',
      'Nyomni, mert kész lehetne': 'Nyomni',
    };
    return shortLabels[label] ?? label;
  }

  /**
   * Ikon a státuszhoz
   */
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

  isGuestsLow(): boolean {
    const project = this.project();
    if (!project.expectedClassSize) return false;
    return project.guestsCount < project.expectedClassSize * 0.8;
  }

  onSamplesClick(event: MouseEvent): void {
    event.stopPropagation();
    const project = this.project();
    if (project.sampleThumbUrl) {
      this.samplesClick.emit(project);
    }
  }

  onMissingClick(event: MouseEvent): void {
    event.stopPropagation();
    const project = this.project();
    if (project.missingCount > 0) {
      this.missingClick.emit(project);
    }
  }

  onQrClick(event: MouseEvent): void {
    event.stopPropagation();
    this.qrClick.emit(this.project());
  }

  onAwareClick(event: MouseEvent): void {
    event.stopPropagation();
    this.awareClick.emit(this.project());
  }

  onPhotosUploadedClick(event: MouseEvent): void {
    event.stopPropagation();
    this.photosUploadedClick.emit(this.project());
  }

  onOrderDataClick(event: MouseEvent): void {
    event.stopPropagation();
    this.orderDataClick.emit(this.project());
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteClick.emit(this.project());
  }

  onLinkClick(event: MouseEvent): void {
    event.stopPropagation();
    this.linkClick.emit(this.project());
  }

  onStatusChange(event: { value: string; label: string; color: string }): void {
    this.statusChangeClick.emit({
      projectId: this.project().id,
      status: event.value,
      label: event.label,
      color: event.color,
    });
  }
}
