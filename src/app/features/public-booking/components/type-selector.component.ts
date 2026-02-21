import {
  Component, input, output, ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { SessionType, LOCATION_TYPE_LABELS } from '../../partner/models/booking.models';

@Component({
  selector: 'app-type-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, DecimalPipe],
  template: `
    <h2 class="section-title">Valasszon szolgaltatas tipust</h2>
    <div class="type-grid">
      @for (type of types(); track type.id; let i = $index) {
        <button
          class="type-card"
          [style.border-color]="type.color"
          [style.animation-delay]="i * 0.06 + 's'"
          (click)="select.emit(type)">
          <div class="type-icon" [style.background]="type.color + '18'" [style.color]="type.color">
            <lucide-icon [name]="type.icon ?? ICONS.CALENDAR" [size]="24" />
          </div>
          <div class="type-info">
            <h3>{{ type.name }}</h3>
            <div class="type-meta">
              <span class="meta-item">
                <lucide-icon [name]="ICONS.CLOCK" [size]="14" />
                {{ type.duration_minutes }} perc
              </span>
              @if (type.price !== null && type.price !== undefined) {
                <span class="meta-item">
                  <lucide-icon [name]="ICONS.WALLET" [size]="14" />
                  {{ type.price | number:'1.0-0' }} Ft
                </span>
              }
              <span class="meta-item">
                <lucide-icon [name]="ICONS.MAP_PIN" [size]="14" />
                {{ locationLabel(type.location_type) }}
              </span>
            </div>
            @if (type.description) {
              <p class="type-desc">{{ type.description }}</p>
            }
          </div>
          <lucide-icon class="type-arrow" [name]="ICONS.CHEVRON_RIGHT" [size]="20" />
        </button>
      } @empty {
        <div class="empty-state">Jelenleg nincs elerheto szolgaltatas tipus.</div>
      }
    </div>
  `,
  styles: [`
    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 20px; }
    .type-grid { display: flex; flex-direction: column; }
    .type-grid > * { margin-bottom: 12px; }
    .type-grid > *:last-child { margin-bottom: 0; }
    .type-card {
      display: flex; align-items: center; width: 100%; padding: 16px;
      border: 2px solid #e2e8f0; border-radius: 12px; background: #fff;
      cursor: pointer; transition: all 0.2s ease; text-align: left;
      animation: fadeSlideUp 0.3s ease both;
    }
    .type-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .type-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .type-info { flex: 1; margin-left: 14px; margin-right: 8px; }
    .type-info h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 6px; }
    .type-meta {
      display: flex; flex-wrap: wrap; margin-left: -10px;
    }
    .meta-item {
      display: inline-flex; align-items: center; color: #64748b; font-size: 13px;
      margin-left: 10px; margin-bottom: 2px;
    }
    .meta-item lucide-icon { margin-right: 4px; }
    .type-desc { color: #94a3b8; font-size: 13px; margin: 6px 0 0; line-height: 1.4; }
    .type-arrow { color: #cbd5e1; flex-shrink: 0; }
    .empty-state { text-align: center; padding: 32px; color: #94a3b8; font-size: 15px; }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class TypeSelectorComponent {
  readonly types = input.required<SessionType[]>();
  readonly select = output<SessionType>();
  readonly ICONS = ICONS;

  private readonly labels = LOCATION_TYPE_LABELS;

  locationLabel(type: string): string {
    return this.labels[type as keyof typeof LOCATION_TYPE_LABELS] ?? type;
  }
}
