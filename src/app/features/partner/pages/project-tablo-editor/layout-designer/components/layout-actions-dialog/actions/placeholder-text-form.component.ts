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
  groupName: string;
  random: boolean;
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

function fixedLorem(length: number): string {
  const source = LOREM_WORDS.join(' ');
  let result = '';
  while (result.length < length) {
    result += source + ' ';
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

function fixedNumbers(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String(i % 10);
  }
  return result;
}

@Component({
  selector: 'app-placeholder-text-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsSelectComponent],
  template: `
    <div class="form">
      <!-- Csoport nev -->
      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.FOLDER" [size]="14" />
          Csoport neve
        </label>
        <input
          type="text"
          class="form__input"
          placeholder="pl. Alcímek (üres = Names mappába)"
          [ngModel]="groupName()"
          (ngModelChange)="groupName.set($event)"
        />
      </div>

      <!-- Szoveg tipus -->
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

      <!-- Karakter hossz -->
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

      <!-- Random toggle -->
      <label class="form__toggle">
        <input type="checkbox" [checked]="random()" (change)="random.set(!random())" />
        <span>Random (mindenkinél más szöveg)</span>
      </label>

      <!-- Minta -->
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

    .form__toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      user-select: none;

      input[type="checkbox"] {
        width: 14px;
        height: 14px;
        accent-color: #a78bfa;
        cursor: pointer;
      }
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

  readonly groupName = signal('');
  readonly textType = signal<'lorem' | 'numbers'>('lorem');
  readonly charLength = signal<number>(20);
  readonly random = signal(true);

  readonly typeOptions: PsSelectOption[] = [
    { id: 'lorem', label: 'Lorem Ipsum' },
    { id: 'numbers', label: 'Random számok' },
  ];

  readonly charLengthStr = computed(() => String(this.charLength()));

  readonly preview = computed(() => {
    const type = this.textType();
    const len = this.charLength();
    const rnd = this.random();
    if (rnd) {
      return type === 'numbers' ? randomNumbers(len) : shuffledLorem(len);
    }
    return type === 'numbers' ? fixedNumbers(len) : fixedLorem(len);
  });

  readonly formData = computed<PlaceholderTextFormData | null>(() => {
    const name = this.groupName().trim();
    const len = this.charLength();
    if (!len || len <= 0) return null;
    return {
      textType: this.textType(),
      charLength: len,
      groupName: name,
      random: this.random(),
    };
  });

  generateText(type: 'lorem' | 'numbers', length: number, isRandom: boolean): string {
    if (isRandom) {
      return type === 'numbers' ? randomNumbers(length) : shuffledLorem(length);
    }
    return type === 'numbers' ? fixedNumbers(length) : fixedLorem(length);
  }

  onLengthChange(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      this.charLength.set(Math.min(num, 500));
    }
  }
}
