import {
  Component, ChangeDetectionStrategy, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsSelectComponent } from '@shared/components/form/ps-select/ps-select.component';
import { PsSelectOption } from '@shared/components/form/form.types';

export interface ResizeFormData {
  width: number | null;
  height: number | null;
  unit: 'cm' | 'px';
}

@Component({
  selector: 'app-resize-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsSelectComponent],
  template: `
    <div class="form">
      <!-- Mertekegyseg -->
      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.RULER" [size]="14" />
          Mertekegyseg
        </label>
        <ps-select
          [options]="unitOptions"
          [ngModel]="unit()"
          (ngModelChange)="unit.set($event)"
          overlayClass="ps-overlay--dark"
        />
      </div>

      <!-- Szelesseg -->
      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.MAXIMIZE_2" [size]="14" />
          Szelesseg ({{ unit() }})
        </label>
        <input
          type="number"
          class="form__input"
          [placeholder]="unit() === 'cm' ? 'pl. 5' : 'pl. 400'"
          [ngModel]="widthStr()"
          (ngModelChange)="onWidthChange($event)"
          min="0"
          step="0.1"
        />
      </div>

      <!-- Magassag -->
      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.MAXIMIZE_2" [size]="14" />
          Magassag ({{ unit() }})
        </label>
        <input
          type="number"
          class="form__input"
          [placeholder]="unit() === 'cm' ? 'pl. 7' : 'pl. 600'"
          [ngModel]="heightStr()"
          (ngModelChange)="onHeightChange($event)"
          min="0"
          step="0.1"
        />
      </div>

      <div class="form__hint">
        Ha csak az egyiket adod meg, az arany megmarad.
      </div>
    </div>
  `,
  styles: [`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form__label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
    }

    .form__input {
      padding: 8px 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.04);
      color: #fff;
      font-size: 0.8rem;
      outline: none;
      transition: border-color 0.15s;

      &::placeholder { color: rgba(255, 255, 255, 0.25); }
      &:focus { border-color: rgba(167, 139, 250, 0.5); }
    }

    /* Chrome/Safari: number input nyilak eltuntetese */
    .form__input::-webkit-outer-spin-button,
    .form__input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .form__hint {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.35);
      font-style: italic;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizeFormComponent {
  protected readonly ICONS = ICONS;

  readonly unit = signal<'cm' | 'px'>('cm');
  readonly width = signal<number | null>(null);
  readonly height = signal<number | null>(null);

  readonly unitOptions: PsSelectOption[] = [
    { id: 'cm', label: 'cm' },
    { id: 'px', label: 'px' },
  ];

  /** Input mezokhöz string reprezentacio (ures = null) */
  readonly widthStr = computed(() => {
    const w = this.width();
    return w !== null ? String(w) : '';
  });

  readonly heightStr = computed(() => {
    const h = this.height();
    return h !== null ? String(h) : '';
  });

  readonly formData = computed<ResizeFormData | null>(() => {
    const w = this.width();
    const h = this.height();
    if (w === null && h === null) return null;
    if (w !== null && w <= 0) return null;
    if (h !== null && h <= 0) return null;
    return { width: w, height: h, unit: this.unit() };
  });

  onWidthChange(value: string): void {
    const num = value === '' ? null : parseFloat(value);
    this.width.set(num !== null && isNaN(num) ? null : num);
  }

  onHeightChange(value: string): void {
    const num = value === '' ? null : parseFloat(value);
    this.height.set(num !== null && isNaN(num) ? null : num);
  }
}
