import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokePreset } from '../../../core/models/poke.models';

/**
 * Preset Selector Component
 *
 * Preset üzenet választó grid.
 */
@Component({
  selector: 'app-preset-selector',
  imports: [CommonModule],
  templateUrl: './preset-selector.component.html',
  styleUrls: ['./preset-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetSelectorComponent {
  readonly presets = input.required<PokePreset[]>();
  readonly selected = input<PokePreset | null>(null);

  readonly select = output<PokePreset>();

  /**
   * Preset kiválasztás
   */
  onSelect(preset: PokePreset): void {
    this.select.emit(preset);
  }

  /**
   * Kiválasztott-e
   */
  isSelected(preset: PokePreset): boolean {
    return this.selected()?.key === preset.key;
  }

  /**
   * TrackBy
   */
  trackByKey(index: number, preset: PokePreset): string {
    return preset.key;
  }
}
