import {
  Component, ChangeDetectionStrategy, output, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DropZoneComponent } from '@shared/components/drop-zone/drop-zone.component';

export interface UploadToEveryoneFormData {
  groupName: string;
  files: File[];
}

@Component({
  selector: 'app-upload-to-everyone-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DropZoneComponent],
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
                <lucide-icon [name]="ICONS.FILE" [size]="14" />
                <span class="form__file-name">{{ f.name }}</span>
                <button class="form__file-remove" (click)="removeFile(f)">
                  <lucide-icon [name]="ICONS.X" [size]="12" />
                </button>
              </div>
            }
          </div>
        }
        <app-drop-zone
          accept=".jpg,.jpeg,.png,.webp"
          hint="JPG, PNG, WebP"
          maxSize="Tetszoleges szamu kep"
          (filesSelected)="onFilesSelected($event)"
        />
      </div>

      @if (files().length > 0) {
        <div class="form__hint">
          @if (files().length === 1) {
            Mindenki ugyanezt az 1 kepet kapja.
          } @else {
            {{ files().length }} kep — veletlenszeruen kiosztva a kivalasztott szemelyekhez.
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
      flex-direction: column;
      gap: 4px;
      max-height: 120px;
      overflow-y: auto;
    }

    .form__file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.7rem;
    }

    .form__file-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .form__file-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 3px;
      background: transparent;
      color: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.12s;

      &:hover {
        background: rgba(255, 80, 80, 0.2);
        color: #fca5a5;
      }
    }

    .form__hint {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.4);
      font-style: italic;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadToEveryoneFormComponent {
  protected readonly ICONS = ICONS;

  readonly groupName = signal('');
  readonly files = signal<File[]>([]);

  readonly formData = computed<UploadToEveryoneFormData | null>(() => {
    const name = this.groupName().trim();
    const f = this.files();
    if (!name || f.length === 0) return null;
    return { groupName: name, files: f };
  });

  /** A szulo olvassa a formData()-t kozvetlenul */
  readonly formDataChange = output<UploadToEveryoneFormData | null>();

  onFilesSelected(newFiles: File[]): void {
    const current = this.files();
    this.files.set([...current, ...newFiles]);
    this.formDataChange.emit(this.formData());
  }

  removeFile(file: File): void {
    this.files.update(list => list.filter(f => f !== file));
    this.formDataChange.emit(this.formData());
  }
}
