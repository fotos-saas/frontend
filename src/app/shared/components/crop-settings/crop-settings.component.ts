import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { CropSettingsActionsService } from './crop-settings-actions.service';
import { CropCalibrationDialogComponent } from '@shared/components/crop-calibration-dialog/crop-calibration-dialog.component';
import type { CropPreset, CropSettings, AspectRatio, NoFaceAction, MultiFaceAction } from '@features/partner/models/crop.models';

@Component({
  selector: 'app-crop-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, CropCalibrationDialogComponent],
  providers: [CropSettingsActionsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crop-settings.component.html',
  styleUrl: './crop-settings.component.scss',
})
export class CropSettingsComponent implements OnInit {
  readonly actions = inject(CropSettingsActionsService);
  readonly settings = computed(() => this.actions.settings());
  readonly ICONS = ICONS;

  /** Kalibráció dialógus */
  readonly showCalibration = signal(false);

  readonly PRESETS: Array<{ value: CropPreset; label: string; description: string }> = [
    { value: 'school_portrait', label: 'Iskolai portré', description: 'Klasszikus igazolványkép-stílusú vágás' },
    { value: 'yearbook', label: 'Évkönyv', description: 'Szűkebb keretezés, kevesebb váll' },
    { value: 'passport', label: 'Igazolvány', description: 'Hivatalos fotó arányok' },
    { value: 'headshot', label: 'Fejkép', description: 'Szoros fejfókusz, négyzetes' },
    { value: 'custom', label: 'Egyedi', description: 'Saját beállítások' },
  ];

  readonly ASPECT_RATIOS: Array<{ value: AspectRatio; label: string }> = [
    { value: '3:4', label: '3:4' },
    { value: '4:5', label: '4:5' },
    { value: '2:3', label: '2:3' },
    { value: '1:1', label: '1:1' },
    { value: '5:7', label: '5:7' },
  ];

  readonly NO_FACE_ACTIONS: Array<{ value: NoFaceAction; label: string }> = [
    { value: 'skip', label: 'Kihagyás' },
    { value: 'center_crop', label: 'Középre vágás' },
    { value: 'original', label: 'Eredeti megtartása' },
  ];

  readonly MULTI_FACE_ACTIONS: Array<{ value: MultiFaceAction; label: string }> = [
    { value: 'largest', label: 'Legnagyobb arc' },
    { value: 'first', label: 'Első arc' },
    { value: 'skip', label: 'Kihagyás' },
  ];

  readonly isCustomPreset = computed(() => this.settings().preset === 'custom');
  readonly activePresetLabel = computed(() => {
    const preset = this.PRESETS.find(p => p.value === this.settings().preset);
    return preset?.label ?? 'Iskolai portré';
  });

  ngOnInit(): void {
    this.actions.load();
  }

  onPresetChange(preset: CropPreset): void {
    this.actions.applyPreset(preset);
  }

  onToggleEnabled(enabled: boolean): void {
    this.actions.updateSetting('enabled', enabled);
  }

  onAspectRatioChange(ratio: AspectRatio): void {
    this.actions.updateSetting('aspect_ratio', ratio);
    this.actions.updateSetting('preset', 'custom');
  }

  onSliderChange(key: 'head_padding_top' | 'chin_padding_bottom' | 'shoulder_width' | 'face_position_y', value: number): void {
    this.actions.updateSetting(key, value);
    this.actions.updateSetting('preset', 'custom');
  }

  onNoFaceChange(action: NoFaceAction): void {
    this.actions.updateSetting('no_face_action', action);
  }

  onMultiFaceChange(action: MultiFaceAction): void {
    this.actions.updateSetting('multi_face_action', action);
  }

  onQualityChange(quality: number): void {
    this.actions.updateSetting('output_quality', quality);
  }

  onCalibrationApply(calibrated: CropSettings): void {
    this.actions.settings.set({ ...this.actions.settings(), ...calibrated });
    this.showCalibration.set(false);
  }
}
