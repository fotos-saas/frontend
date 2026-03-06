import {
  Component, ChangeDetectionStrategy, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsSelectComponent } from '@shared/components/form/ps-select/ps-select.component';
import { PsSelectOption } from '@shared/components/form/form.types';

export interface PlaceholderTextFormData {
  textType: 'lorem' | 'numbers';
  charLength: number;
}

const LOREM_SOURCE = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur';

@Component({
  selector: 'app-placeholder-text-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsSelectComponent],
  template: `
    <div class="form">
      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.TYPE" [size]="14" />
          Szöveg típusa
        </label>
        <ps-select
          [options]="typeOptions"
          [ngModel]="textType()"
          (ngModelChange)="textType.set($event)"
          overlayClass="ps-overlay--dark"
        />
      </div>

      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.HASH" [size]="14" />
          Karakter hossz
        </label>
        <input
          type="number"
          class="form__input"
          placeholder="pl. 20"
          [ngModel]="charLengthStr()"
          (ngModelChange)="onLengthChange($event)"
          min="1"
          max="500"
          step="1"
        />
      </div>

      <div class="form__preview">
        <span class="form__preview-label">Minta:</span>
        <span class="form__preview-text">{{ preview() }}</span>
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

    .form__input::-webkit-outer-spin-button,
    .form__input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .form__preview {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .form__preview-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form__preview-text {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      word-break: break-all;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderTextFormComponent {
  protected readonly ICONS = ICONS;

  readonly textType = signal<'lorem' | 'numbers'>('lorem');
  readonly charLength = signal<number>(20);

  readonly typeOptions: PsSelectOption[] = [
    { id: 'lorem', label: 'Lorem Ipsum' },
    { id: 'numbers', label: 'Random számok' },
  ];

  readonly charLengthStr = computed(() => String(this.charLength()));

  readonly preview = computed(() => this.generateText(this.textType(), this.charLength()));

  readonly formData = computed<PlaceholderTextFormData | null>(() => {
    const len = this.charLength();
    if (!len || len <= 0) return null;
    return { textType: this.textType(), charLength: len };
  });

  generateText(type: 'lorem' | 'numbers', length: number): string {
    if (type === 'numbers') {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += String(Math.floor(Math.random() * 10));
      }
      return result;
    }

    // Lorem ipsum — ciklikus ismétlés
    let result = '';
    while (result.length < length) {
      result += LOREM_SOURCE + ' ';
    }
    return result.substring(0, length);
  }

  onLengthChange(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      this.charLength.set(Math.min(num, 500));
    }
  }
}
