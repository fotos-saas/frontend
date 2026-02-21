import {
  Component, ChangeDetectionStrategy, input, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { matchFilesToPersons } from '@shared/utils/filename-matcher.util';
import { ActionPersonItem } from '../layout-actions.types';

export interface PersonFileAssignment {
  personId: number;
  personName: string;
  file: File | null;
  matchType: 'matched' | 'ambiguous' | 'unmatched';
  confidence: number;
}

export interface UploadIndividualFormData {
  groupName: string;
  assignments: Array<{ personId: number; file: File }>;
}

@Component({
  selector: 'app-upload-individual-form',
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
          placeholder="pl. Portre"
          [ngModel]="groupName()"
          (ngModelChange)="groupName.set($event)"
        />
      </div>

      <div class="form__field">
        <label class="form__label">
          <lucide-icon [name]="ICONS.IMAGE" [size]="14" />
          Kepek *
        </label>
        <div class="mini-drop"
          [class.mini-drop--active]="isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragging.set(false)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          <input #fileInput type="file" multiple accept=".jpg,.jpeg,.png,.webp"
            (change)="onFileInput($event)" class="sr-only" />
          <lucide-icon [name]="ICONS.UPLOAD" [size]="16" />
          <span>{{ files().length > 0 ? 'Tovabbi kepek...' : 'Kepek valasztasa' }}</span>
        </div>
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
export class UploadIndividualFormComponent {
  protected readonly ICONS = ICONS;

  readonly persons = input.required<ActionPersonItem[]>();

  readonly groupName = signal('');
  readonly files = signal<File[]>([]);
  readonly assignments = signal<PersonFileAssignment[]>([]);
  readonly isDragging = signal(false);

  readonly assignedCount = computed(() =>
    this.assignments().filter(a => a.file !== null).length
  );

  readonly unassignedFiles = computed(() => {
    const assignedKeys = new Set(
      this.assignments().filter(a => a.file).map(a => this.getFileKey(a.file!))
    );
    return this.files().filter(f => !assignedKeys.has(this.getFileKey(f)));
  });

  readonly formData = computed<UploadIndividualFormData | null>(() => {
    const name = this.groupName().trim();
    const assigned = this.assignments().filter(a => a.file !== null);
    if (!name || assigned.length === 0) return null;
    return {
      groupName: name,
      assignments: assigned.map(a => ({ personId: a.personId, file: a.file! })),
    };
  });

  private readonly ACCEPTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

  getFileKey(file: File): string {
    return file.name + '|' + file.size;
  }

  /** A select dropdown-ban csak a szabad fájlokat + az adott személyhez rendelt fájlt mutatjuk */
  availableFilesFor(personId: number): File[] {
    const assignedKeys = new Set<string>();
    for (const a of this.assignments()) {
      if (a.file && a.personId !== personId) {
        assignedKeys.add(this.getFileKey(a.file));
      }
    }
    return this.files().filter(f => !assignedKeys.has(this.getFileKey(f)));
  }

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

  onFileSelect(personId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedKey = select.value;

    this.assignments.update(list => {
      // Ha masik szemelytol elvesszuk a fajlt, azt null-ra allitjuk
      if (selectedKey) {
        list = list.map(a => {
          if (a.personId !== personId && a.file && this.getFileKey(a.file) === selectedKey) {
            return { ...a, file: null, matchType: 'unmatched' as const, confidence: 0 };
          }
          return a;
        });
      }

      return list.map(a => {
        if (a.personId !== personId) return a;
        if (!selectedKey) {
          return { ...a, file: null, matchType: 'unmatched' as const, confidence: 0 };
        }
        const file = this.files().find(f => this.getFileKey(f) === selectedKey) ?? null;
        return {
          ...a,
          file,
          matchType: file ? 'matched' as const : 'unmatched' as const,
          confidence: file ? 100 : 0,
        };
      });
    });
  }

  runMatching(): void {
    const persons = this.persons();
    const files = this.files();

    if (files.length === 0) {
      this.assignments.set(persons.map(p => ({
        personId: p.id,
        personName: p.name,
        file: null,
        matchType: 'unmatched' as const,
        confidence: 0,
      })));
      return;
    }

    const matchResults = matchFilesToPersons(files, persons.map(p => ({ id: p.id, name: p.name })));

    // matchResults indexeli a fajlokat → personId-re map-eljuk
    const personFileMap = new Map<number, { file: File; matchType: 'matched' | 'ambiguous' | 'unmatched'; confidence: number }>();
    for (const result of matchResults) {
      if (result.personId !== null) {
        personFileMap.set(result.personId, {
          file: result.file,
          matchType: result.matchType,
          confidence: result.confidence,
        });
      }
    }

    this.assignments.set(persons.map(p => {
      const match = personFileMap.get(p.id);
      return {
        personId: p.id,
        personName: p.name,
        file: match?.file ?? null,
        matchType: match?.matchType ?? 'unmatched',
        confidence: match?.confidence ?? 0,
      };
    }));
  }

  private addFiles(newFiles: File[]): void {
    const valid = newFiles.filter(f => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return this.ACCEPTED.has(ext);
    });
    if (valid.length === 0) return;
    this.files.update(list => [...list, ...valid]);
    this.runMatching();
  }
}
