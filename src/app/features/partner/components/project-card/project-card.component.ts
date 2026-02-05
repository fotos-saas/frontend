import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerProjectListItem } from '../../services/partner.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Partner Project Card - Projekt sor a fotós felületen.
 * Lista nézet - soronként egy projekt.
 */
@Component({
  selector: 'app-partner-project-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCardComponent {
  readonly ICONS = ICONS;

  @Input({ required: true }) project!: PartnerProjectListItem;

  @Output() cardClick = new EventEmitter<PartnerProjectListItem>();
  @Output() samplesClick = new EventEmitter<PartnerProjectListItem>();
  @Output() missingClick = new EventEmitter<PartnerProjectListItem>();
  @Output() qrClick = new EventEmitter<PartnerProjectListItem>();
  @Output() awareClick = new EventEmitter<PartnerProjectListItem>();

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
    if (!this.project.expectedClassSize) return false;
    return this.project.guestsCount < this.project.expectedClassSize * 0.8;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  onSamplesClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.project.sampleThumbUrl) {
      this.samplesClick.emit(this.project);
    }
  }

  onMissingClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.project.missingCount > 0) {
      this.missingClick.emit(this.project);
    }
  }

  onQrClick(event: MouseEvent): void {
    event.stopPropagation();
    this.qrClick.emit(this.project);
  }

  onAwareClick(event: MouseEvent): void {
    event.stopPropagation();
    this.awareClick.emit(this.project);
  }
}
