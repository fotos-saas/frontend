import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, DestroyRef, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PresetSelectorComponent } from '../preset-selector/preset-selector.component';
import { PsTextareaComponent } from '@shared/components/form';
import { PokeService } from '../../../core/services/poke.service';
import { MissingUser, PokeCategory, PokePreset } from '../../../core/models/poke.models';
import { createBackdropHandler } from '../../../shared/utils/dialog.util';

/**
 * Poke Composer Component
 *
 * Bökés üzenet összeállító dialógus.
 */
@Component({
  selector: 'app-poke-composer',
  imports: [
    FormsModule,
    PresetSelectorComponent,
    PsTextareaComponent,
  ],
  templateUrl: './poke-composer.component.html',
  styleUrls: ['./poke-composer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeComposerComponent implements OnInit {
  private readonly pokeService = inject(PokeService);
  private readonly destroyRef = inject(DestroyRef);

  /** Signal-based inputs */
  readonly user = input.required<MissingUser>();
  readonly category = input.required<PokeCategory>();

  /** Signal-based outputs */
  readonly resultEvent = output<{
    action: 'send' | 'cancel';
    presetKey?: string;
    customMessage?: string;
  }>();

  /** Kiválasztott preset */
  readonly selectedPreset = signal<PokePreset | null>(null);

  /** Egyéni üzenet */
  readonly customMessage = signal<string>('');

  /** Egyéni üzenet mód */
  readonly showCustomInput = signal<boolean>(false);

  /** Preset-ek */
  readonly presets = signal<PokePreset[]>([]);

  /** Backdrop handler - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  readonly backdropHandler = createBackdropHandler(() => this.cancel());

  ngOnInit(): void {
    // Preset-ek betöltése (cache-ből vagy API-ból)
    const cachedPresets = this.pokeService.presetsForCategory(this.category());
    if (cachedPresets.length > 0) {
      this.presets.set(cachedPresets);
    } else {
      this.pokeService.loadPresets(this.category())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(presets => {
          this.presets.set(presets);
        });
    }
  }

  /**
   * Preset kiválasztás
   */
  onPresetSelect(preset: PokePreset): void {
    this.selectedPreset.set(preset);
    this.showCustomInput.set(false);
  }

  /**
   * Egyéni üzenet mód váltás
   */
  toggleCustomInput(): void {
    this.showCustomInput.update(v => !v);
    if (this.showCustomInput()) {
      this.selectedPreset.set(null);
    }
  }

  /**
   * Küldés
   */
  send(): void {
    const preset = this.selectedPreset();
    const custom = this.customMessage();

    if (preset) {
      this.resultEvent.emit({
        action: 'send',
        presetKey: preset.key
      });
    } else if (custom.trim()) {
      this.resultEvent.emit({
        action: 'send',
        customMessage: custom.trim()
      });
    } else {
      // Alapértelmezett bökés (üzenet nélkül)
      this.resultEvent.emit({
        action: 'send'
      });
    }
  }

  /**
   * Mégse
   */
  cancel(): void {
    this.resultEvent.emit({ action: 'cancel' });
  }

  /**
   * Van kiválasztott üzenet?
   */
  readonly hasSelection = computed(() => {
    return this.selectedPreset() !== null || this.customMessage().trim().length > 0;
  });
}
