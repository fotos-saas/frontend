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

const LOREM_WORDS = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip commodo consequat aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat proident sunt culpa qui officia deserunt mollit anim'.split(' ');

function shuffledLorem(length: number): string {
  let result = '';
  while (result.length < length) {
    const word = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    result += (result.length === 0 ? '' : ' ') + word;
  }
  return result.substring(0, length);
}

function randomNumbers(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String(Math.floor(Math.random() * 10));
  }
  return result;
}

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
        <div class="form__preview-header">
          <span class="form__preview-label">Minta:</span>
          <button type="button" class="form__preview-refresh" (click)="refresh()">
            <lucide-icon [name]="ICONS.REFRESH" [size]="12" />
          </button>
        </div>
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

    .form__preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form__preview-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form__preview-refresh {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      background: transparent;
      color: rgba(167, 139, 250, 0.6);
      cursor: pointer;
      transition: all 0.12s;

      &:hover {
        background: rgba(167, 139, 250, 0.1);
        color: #a78bfa;
      }
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
  /** Tick signal a preview újragenerálásához */
  readonly seed = signal(0);

  readonly typeOptions: PsSelectOption[] = [
    { id: 'lorem', label: 'Lorem Ipsum' },
    { id: 'numbers', label: 'Random számok' },
  ];

  readonly charLengthStr = computed(() => String(this.charLength()));

  readonly preview = computed(() => {
    this.seed(); // dependency a refresh-hez
    return this.generateText(this.textType(), this.charLength());
  });

  readonly formData = computed<PlaceholderTextFormData | null>(() => {
    const len = this.charLength();
    if (!len || len <= 0) return null;
    return { textType: this.textType(), charLength: len };
  });

  generateText(type: 'lorem' | 'numbers', length: number): string {
    return type === 'numbers' ? randomNumbers(length) : shuffledLorem(length);
  }

  refresh(): void {
    this.seed.update(v => v + 1);
  }

  onLengthChange(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      this.charLength.set(Math.min(num, 500));
    }
  }
}
