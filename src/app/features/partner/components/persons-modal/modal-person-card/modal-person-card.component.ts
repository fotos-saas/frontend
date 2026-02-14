import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';

/**
 * Személy kártya a személyek listájában.
 */
@Component({
  selector: 'app-modal-person-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div
      class="person-card"
      [class.person-card--no-photo]="!person().hasPhoto"
      [class.person-card--clickable]="person().photoUrl"
      [style.animation-delay]="animationDelay()"
      (click)="onCardClick()"
    >
      <div class="card-photo">
        @if (person().photoThumbUrl) {
          <img [src]="person().photoThumbUrl" [alt]="person().name" loading="lazy" />
          <div class="card-zoom-icon">
            <lucide-icon [name]="ICONS.ZOOM_IN" [size]="16" />
          </div>
        } @else {
          <div class="card-placeholder">
            <lucide-icon [name]="ICONS.USER_X" [size]="24" />
          </div>
        }
      </div>
      <div class="card-info">
        <span class="card-name" [matTooltip]="person().name">{{ person().name }}</span>
        <div class="card-meta">
          <span class="card-type" [class.card-type--teacher]="person().type === 'teacher'">
            {{ person().type === 'student' ? 'Diák' : 'Tanár' }}
          </span>
          @if (person().hasOverride) {
            <span class="card-badge card-badge--override">Egyedi</span>
          }
        </div>
        @if (person().hasOverride) {
          <button class="card-reset-btn" (click)="onResetOverride($event)" title="Visszaállítás alapértelmezettre">
            <lucide-icon [name]="ICONS.UNDO" [size]="12" />
            Visszaállítás
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .person-card {
      background: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      transition: all 0.15s ease;
      animation: cardEntry 0.3s ease forwards;
      opacity: 0;
    }

    .person-card--clickable {
      cursor: pointer;
    }

    .person-card--clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .person-card--clickable:hover .card-zoom-icon {
      opacity: 1;
    }

    @keyframes cardEntry {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .person-card--no-photo {
      border-color: #fecaca;
    }

    .card-photo {
      aspect-ratio: 1;
      background: #e2e8f0;
      overflow: hidden;
      position: relative;
    }

    .card-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-zoom-icon {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .card-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fee2e2;
      color: #ef4444;
    }

    .card-info {
      padding: 6px 8px;
      text-align: center;
    }

    .card-name {
      font-size: 0.6875rem;
      font-weight: 500;
      color: #1e293b;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-type {
      font-size: 0.625rem;
      color: #64748b;
      display: block;
      margin-top: 1px;
    }

    .card-type--teacher {
      color: #7c3aed;
      font-weight: 500;
    }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }

    .card-badge {
      font-size: 0.5625rem;
      padding: 1px 4px;
      border-radius: 3px;
      margin-left: 4px;
      font-weight: 500;
    }

    .card-badge--override {
      background: #dbeafe;
      color: #2563eb;
    }

    .card-reset-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 3px 0;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.5625rem;
      cursor: pointer;
      border-top: 1px solid #e2e8f0;
      transition: all 0.15s ease;
    }

    .card-reset-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .card-reset-btn lucide-icon {
      margin-right: 3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .person-card {
        animation-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPersonCardComponent {
  readonly ICONS = ICONS;

  readonly person = input.required<TabloPersonItem>();
  readonly animationDelay = input<string>('0s');

  readonly cardClick = output<TabloPersonItem>();
  readonly resetOverride = output<TabloPersonItem>();

  onCardClick(): void {
    if (this.person().photoUrl) {
      this.cardClick.emit(this.person());
    }
  }

  onResetOverride(event: Event): void {
    event.stopPropagation();
    this.resetOverride.emit(this.person());
  }
}
