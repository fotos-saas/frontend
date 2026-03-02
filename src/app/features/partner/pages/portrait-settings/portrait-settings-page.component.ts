import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { PortraitSettingsComponent } from '@shared/components/portrait-settings';
import { CropSettingsComponent } from '@shared/components/crop-settings';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

type SettingsTab = 'portrait' | 'crop';

@Component({
  selector: 'app-portrait-settings-page',
  standalone: true,
  imports: [PortraitSettingsComponent, CropSettingsComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="portrait-settings-page page-card page-card--narrow">
      <div class="tab-bar">
        <button class="tab-btn"
                [class.tab-btn--active]="activeTab() === 'portrait'"
                (click)="activeTab.set('portrait')">
          <lucide-icon [name]="ICONS.SCAN_FACE" [size]="16" />
          Háttércsere
        </button>
        <button class="tab-btn"
                [class.tab-btn--active]="activeTab() === 'crop'"
                (click)="activeTab.set('crop')">
          <lucide-icon [name]="ICONS.CROP" [size]="16" />
          Automatikus vágás
        </button>
      </div>

      @if (activeTab() === 'portrait') {
        <app-portrait-settings />
      } @else {
        <app-crop-settings />
      }
    </div>
  `,
  styles: [`
    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--border-light, #e5e7eb);
      margin-bottom: 16px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      padding: 10px 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted, #9ca3af);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      margin-bottom: -1px;

      lucide-icon {
        margin-right: 6px;
      }

      &:hover {
        color: var(--text-primary);
      }

      &--active {
        color: var(--primary, #8b5cf6);
        border-bottom-color: var(--primary, #8b5cf6);
      }
    }
  `],
})
export class PortraitSettingsPageComponent {
  readonly ICONS = ICONS;
  readonly activeTab = signal<SettingsTab>('portrait');
}
