import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { PortraitSettingsComponent } from '@shared/components/portrait-settings';
import { CropSettingsComponent } from '@shared/components/crop-settings';
import { CropCalibrationDialogComponent } from '@shared/components/crop-calibration-dialog/crop-calibration-dialog.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import type { CropSettings } from '../../models/crop.models';

type SettingsTab = 'portrait' | 'crop';

@Component({
  selector: 'app-portrait-settings-page',
  standalone: true,
  imports: [PortraitSettingsComponent, CropSettingsComponent, CropCalibrationDialogComponent, LucideAngularModule],
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
        <app-crop-settings (openCalibration)="showCalibration.set(true)" />
      }
    </div>

    @if (showCalibration()) {
      <app-crop-calibration-dialog
        [initialSettings]="cropSettingsRef()?.settings() ?? defaultSettings"
        (close)="showCalibration.set(false)"
        (apply)="onCalibrationApply($event)" />
    }
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
  readonly showCalibration = signal(false);
  readonly cropSettingsRef = viewChild(CropSettingsComponent);

  readonly defaultSettings: CropSettings = {
    enabled: false, preset: 'school_portrait',
    head_padding_top: 0.25, chin_padding_bottom: 0.40,
    shoulder_width: 0.85, face_position_y: 0.38,
    aspect_ratio: '4:5', output_quality: 95,
    no_face_action: 'skip', multi_face_action: 'largest',
  };

  onCalibrationApply(calibrated: CropSettings): void {
    this.cropSettingsRef()?.applyCalibration(calibrated);
    this.showCalibration.set(false);
  }
}
