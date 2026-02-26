import { Component, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { PsInputComponent, PsToggleComponent, PsSelectComponent, PsSelectOption } from '@shared/components/form';
import { InfoBoxComponent } from '../../../components/info-box';
import { ToastService } from '../../../../core/services/toast.service';
import { PortraitSettingsActionsService } from './portrait-settings-actions.service';
import {
  PRESET_BACKGROUNDS,
  type PortraitBackgroundType,
  type PortraitMode,
} from '../../../../features/partner/models/portrait.models';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

@Component({
  selector: 'app-portrait-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, InfoBoxComponent, PsInputComponent, PsToggleComponent, PsSelectComponent],
  providers: [PortraitSettingsActionsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portrait-settings.component.html',
  styleUrl: './portrait-settings.component.scss',
})
export class PortraitSettingsComponent implements OnInit {
  readonly actions = inject(PortraitSettingsActionsService);
  private toast = inject(ToastService);
  readonly ICONS = ICONS;
  readonly PRESET_BACKGROUNDS = PRESET_BACKGROUNDS;

  readonly modeOptions: PsSelectOption[] = [
    { id: 'replace', label: 'Háttér cseréje' },
    { id: 'darken', label: 'Háttér sötétítése' },
  ];

  readonly bgTypeOptions: PsSelectOption[] = [
    { id: 'preset', label: 'Előre beállított szín' },
    { id: 'color', label: 'Egyedi szín' },
    { id: 'image', label: 'Feltöltött kép' },
    { id: 'gradient', label: 'Átmenet (gradient)' },
  ];

  readonly gradientDirOptions: PsSelectOption[] = [
    { id: 'vertical', label: 'Függőleges' },
    { id: 'horizontal', label: 'Vízszintes' },
    { id: 'radial', label: 'Körkörös' },
  ];

  readonly settings = computed(() => this.actions.settings());
  readonly isReplace = computed(() => this.settings().mode === 'replace');
  readonly isDarken = computed(() => this.settings().mode === 'darken');

  readonly selectedPresetLabel = computed(() => {
    const name = this.settings().preset_name;
    return PRESET_BACKGROUNDS.find(p => p.name === name)?.label ?? name ?? '-';
  });

  readonly colorPreviewStyle = computed(() => {
    const s = this.settings();
    const r = Number(s.color_r) || 0;
    const g = Number(s.color_g) || 0;
    const b = Number(s.color_b) || 0;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  });

  readonly gradientPreviewStyle = computed(() => {
    const s = this.settings();
    const start = `rgb(${Number(s.gradient_start_r) || 0},${Number(s.gradient_start_g) || 0},${Number(s.gradient_start_b) || 0})`;
    const end = `rgb(${Number(s.gradient_end_r) || 0},${Number(s.gradient_end_g) || 0},${Number(s.gradient_end_b) || 0})`;
    const dir = s.gradient_direction ?? 'vertical';
    if (dir === 'radial') return `radial-gradient(circle, ${start}, ${end})`;
    return `linear-gradient(${dir === 'horizontal' ? 'to right' : 'to bottom'}, ${start}, ${end})`;
  });

  ngOnInit(): void {
    this.actions.load();
  }

  onModeChange(mode: string): void {
    this.actions.updateSetting('mode', mode as PortraitMode);
  }

  onBgTypeChange(type: string): void {
    this.actions.updateSetting('background_type', type as PortraitBackgroundType);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.toast.error('Hiba', 'Csak JPG, PNG vagy WebP kép tölthető fel.');
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.toast.error('Hiba', 'A fájl mérete nem haladhatja meg a 20 MB-ot.');
      input.value = '';
      return;
    }

    this.actions.uploadBackground(file);
    input.value = '';
  }

  save(): void {
    this.actions.save();
  }

  deleteBackground(): void {
    this.actions.deleteBackground();
  }
}
