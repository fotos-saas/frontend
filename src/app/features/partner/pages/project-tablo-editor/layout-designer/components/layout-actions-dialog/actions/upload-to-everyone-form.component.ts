import {
  Component, ChangeDetectionStrategy, output, signal, computed, ElementRef, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

export interface UploadToEveryoneFormData {
  groupName: string;
  files: File[];
}

@Component({
  selector: 'app-upload-to-everyone-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="form">
      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.FOLDER" [size]="14" />
          Csoport neve *
        </label>
        <input
          type="text"
          class="form__input"
          placeholder="pl. Csoportkep"
          [ngModel]="groupName()"
          (ngModelChange)="groupName.set($event)"
        />
      </div>

      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.IMAGE" [size]="14" />
          Kepek *
        </label>

        @if (files().length > 0) {
          <div class="form__file-list">
            @for (f of files(); track f.name) {
              <div class="form__file-item">
                <lucide-icon [name]="ICONS.FILE" [size]="12" />
                <span class="form__file-name">{{ f.name }}</span>
                <button class="form__file-remove" (click)="removeFile(f)">
                  <lucide-icon [name]="ICONS.X" [size]="10" />
                </button>
              </div>
            }
          </div>
        }

        <!-- Mini drop zone -->
        <div class="mini-drop"
          [class.mini-drop--active]="isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragging.set(false)"
          (drop)="onDrop($event)"
          (click)="fileInput.nativeElement.click()">
          <input #fileInput type="file" multiple accept=".jpg,.jpeg,.png,.webp"
            (change)="onFileInput($event)" class="sr-only" />
          <lucide-icon [name]="ICONS.UPLOAD" [size]="16" />
          <span>{{ files().length > 0 ? 'Tovabbi kepek...' : 'Kepek valasztasa' }}</span>
        </div>
      </div>

      @if (files().length > 0) {
        <div class="form__hint">
          @if (files().length === 1) {
            Mindenki ugyanezt az 1 kepet kapja.
          } @else {
            {{ files().length }} kep — veletlenszeruen kiosztva.
          }
        </div>
      }
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

    .form__file-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .form__file-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.65rem;
    }

    .form__file-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .form__file-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border: none;
      border-radius: 2px;
      background: transparent;
      color: rgba(255, 255, 255, 0.25);
      cursor: pointer;
      transition: all 0.12s;
      padding: 0;

      &:hover {
        background: rgba(255, 80, 80, 0.2);
        color: #fca5a5;
      }
    }

    .mini-drop {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border: 1.5px dashed rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.02);
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: rgba(167, 139, 250, 0.3);
        color: rgba(255, 255, 255, 0.6);
        background: rgba(167, 139, 250, 0.04);
      }

      &--active {
        border-color: #a78bfa;
        background: rgba(167, 139, 250, 0.08);
        color: #a78bfa;
      }
    }

    .form__hint {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.35);
      font-style: italic;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadToEveryoneFormComponent {
  protected readonly ICONS = ICONS;

  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly groupName = signal('');
  readonly files = signal<File[]>([]);
  readonly isDragging = signal(false);

  readonly formData = computed<UploadToEveryoneFormData | null>(() => {
    const name = this.groupName().trim();
    const f = this.files();
    if (!name || f.length === 0) return null;
    return { groupName: name, files: f };
  });

  readonly formDataChange = output<UploadToEveryoneFormData | null>();

  private readonly ACCEPTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const dt = event.dataTransfer;
    if (!dt?.files?.length) return;
    this.addFiles(Array.from(dt.files));
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  removeFile(file: File): void {
    this.files.update(list => list.filter(f => f !== file));
    this.formDataChange.emit(this.formData());
  }

  private addFiles(newFiles: File[]): void {
    const valid = newFiles.filter(f => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return this.ACCEPTED.has(ext);
    });
    if (valid.length === 0) return;
    this.files.update(list => [...list, ...valid]);
    this.formDataChange.emit(this.formData());
  }
}
