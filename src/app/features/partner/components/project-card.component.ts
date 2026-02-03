import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerProjectListItem } from '../services/partner.service';
import { ICONS } from '../../../shared/constants/icons.constants';

/**
 * Partner Project Card - Projekt sor a fotós felületen.
 * Lista nézet - soronként egy projekt.
 */
@Component({
  selector: 'app-partner-project-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="project-row" (click)="cardClick.emit(project)">
      <!-- Col 1: Minta kép -->
      <div
        class="col col-sample"
        [class.col-sample--clickable]="project.sampleThumbUrl"
        (click)="onSamplesClick($event)"
      >
        @if (project.sampleThumbUrl) {
          <img
            [src]="project.sampleThumbUrl"
            [alt]="'Minta'"
            class="sample-thumb"
          />
        } @else {
          <div class="sample-placeholder">
            <lucide-icon [name]="ICONS.IMAGE" [size]="16" />
          </div>
        }
      </div>

      <!-- Col 2: Iskola + Osztály + Draft jelző -->
      <div class="col col-school">
        <div class="school-name-row">
          <span class="school-name">{{ project.schoolName ?? 'Ismeretlen iskola' }}</span>
          @if (project.draftPhotoCount > 0) {
            <span class="draft-badge" [title]="'Véglegesítésre vár: ' + project.draftPhotoCount + ' kép'">
              <lucide-icon [name]="ICONS.UPLOAD" [size]="10" />
              {{ project.draftPhotoCount }}
            </span>
          }
        </div>
        <span class="school-meta">{{ project.className ?? '-' }} @if (project.classYear) {({{ project.classYear }})} @if (project.contact) { · {{ project.contact.name }}}</span>
      </div>

      <!-- Col 3: Tudnak róla -->
      <div
        class="col col-aware col-aware--clickable"
        (click)="onAwareClick($event)"
        [attr.title]="project.isAware ? 'Tudnak róla - kattints a módosításhoz' : 'Nem tudnak róla - kattints a módosításhoz'"
      >
        <lucide-icon
          [name]="project.isAware ? ICONS.CHECK_CIRCLE : ICONS.CIRCLE"
          [size]="16"
          [class.aware--yes]="project.isAware"
          [class.aware--no]="!project.isAware"
        />
      </div>

      <!-- Col 4: Státusz -->
      <div class="col col-status">
        @if (project.statusLabel) {
          <span
            class="badge"
            [ngClass]="'badge--' + (project.statusColor ?? 'gray')"
            [title]="project.statusLabel"
          >
            <lucide-icon [name]="getStatusIcon(project.status)" [size]="11" />
            {{ getShortStatusLabel(project.statusLabel) }}
          </span>
        }
      </div>

      <!-- Col 5: Hiányzók D:X/T:Y -->
      <div
        class="col col-missing"
        [class.col-missing--danger]="project.missingCount > 0"
        [class.col-missing--clickable]="project.missingCount > 0"
        (click)="onMissingClick($event)"
      >
        <span class="missing-label">D:</span><span class="missing-num" [class.missing-num--active]="project.missingStudentsCount > 0">{{ project.missingStudentsCount }}</span>
        <span class="missing-sep">/</span>
        <span class="missing-label">T:</span><span class="missing-num" [class.missing-num--active]="project.missingTeachersCount > 0">{{ project.missingTeachersCount }}</span>
      </div>

      <!-- Col 6: QR -->
      <div class="col col-actions">
        @if (project.hasActiveQrCode) {
          <button
            type="button"
            class="action-btn"
            (click)="onQrClick($event)"
            title="QR kód"
          >
            <lucide-icon [name]="ICONS.QR_CODE" [size]="14" />
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .project-row {
      display: grid;
      grid-template-columns: 48px 1fr 24px 110px 75px 32px;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .project-row:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .col {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    /* Col: Iskola */
    .col-school {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .school-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
    }

    .school-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    .school-meta {
      font-size: 0.6875rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.2;
    }

    /* Draft badge - véglegesítésre váró fotók jelzése */
    .draft-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 4px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #ffffff;
      white-space: nowrap;
      cursor: default;
      flex-shrink: 0;
    }

    /* Col: Tudnak róla */
    .col-aware {
      justify-content: center;
    }

    .col-aware--clickable {
      cursor: pointer;
      border-radius: 4px;
      padding: 4px;
      margin: -4px;
      transition: background 0.15s ease;
    }

    .col-aware--clickable:hover {
      background: #f1f5f9;
    }

    .aware--yes {
      color: #22c55e;
    }

    .aware--no {
      color: #cbd5e1;
    }

    /* Col: Státusz */
    .col-status {
      justify-content: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Színes badge variánsok - élénk színek, fehér szöveg */
    .badge--gray {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
      color: #ffffff;
    }
    .badge--red {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #ffffff;
    }
    .badge--amber {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #ffffff;
    }
    .badge--green {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: #ffffff;
    }
    .badge--blue {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
    }
    .badge--purple {
      background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
      color: #ffffff;
    }

    /* Col: Missing D:X/T:Y */
    .col-missing {
      justify-content: center;
      gap: 1px;
      font-size: 0.6875rem;
      font-weight: 500;
      color: #94a3b8;
    }

    .col-missing--clickable {
      cursor: pointer;
    }

    .col-missing--clickable:hover {
      color: #64748b;
    }

    .col-missing--danger {
      color: #64748b;
    }

    .missing-label {
      font-weight: 600;
      color: #94a3b8;
    }

    .missing-num {
      color: #94a3b8;
    }

    .missing-num--active {
      color: #dc2626;
      font-weight: 600;
    }

    .missing-sep {
      color: #cbd5e1;
      margin: 0 1px;
    }

    /* Col: Sample thumbnail */
    .col-sample {
      justify-content: center;
    }

    .col-sample--clickable {
      cursor: pointer;
    }

    .sample-thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      transition: all 0.15s ease;
    }

    .col-sample--clickable:hover .sample-thumb {
      border-color: #94a3b8;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .sample-placeholder {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 4px;
      border: 1px dashed #cbd5e1;
      color: #94a3b8;
    }

    /* Col: Actions */
    .col-actions {
      justify-content: center;
      gap: 4px;
    }

    .action-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.1s ease;
      background: #10b981;
      color: #ffffff;
    }

    .action-btn:hover {
      background: #059669;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .project-row {
        grid-template-columns: 36px 1fr 60px;
      }
      .col-aware,
      .col-status,
      .col-actions {
        display: none;
      }
      .sample-thumb,
      .sample-placeholder {
        width: 32px;
        height: 32px;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .project-row {
        transition: none;
      }
    }
  `],
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
