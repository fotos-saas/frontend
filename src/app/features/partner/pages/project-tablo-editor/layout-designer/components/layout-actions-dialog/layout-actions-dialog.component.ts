import {
  Component, ChangeDetectionStrategy, input, output, signal, computed, inject, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { PhotoshopService } from '../../../../../services/photoshop.service';
import { ActionPersonItem } from './layout-actions.types';
import {
  UploadToEveryoneFormComponent,
} from './actions/upload-to-everyone-form.component';

@Component({
  selector: 'app-layout-actions-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, UploadToEveryoneFormComponent],
  templateUrl: './layout-actions-dialog.component.html',
  styleUrl: './layout-actions-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutActionsDialogComponent {
  protected readonly ICONS = ICONS;
  private readonly ps = inject(PhotoshopService);

  readonly persons = input.required<ActionPersonItem[]>();
  readonly preSelectedPersonIds = input<number[]>([]);

  readonly close = output<void>();
  readonly executed = output<void>();

  readonly selectedAction = signal<string>('upload-to-everyone');
  readonly selectedPersonIds = signal<Set<number>>(new Set());
  readonly executing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly uploadForm = viewChild<UploadToEveryoneFormComponent>('uploadForm');

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly students = computed(() => this.persons().filter(p => p.type === 'student'));
  readonly teachers = computed(() => this.persons().filter(p => p.type === 'teacher'));

  readonly selectedCount = computed(() => this.selectedPersonIds().size);

  readonly allStudentsSelected = computed(() => {
    const ids = this.selectedPersonIds();
    return this.students().length > 0 && this.students().every(s => ids.has(s.id));
  });

  readonly allTeachersSelected = computed(() => {
    const ids = this.selectedPersonIds();
    return this.teachers().length > 0 && this.teachers().every(t => ids.has(t.id));
  });

  readonly canExecute = computed(() => {
    if (this.executing()) return false;
    if (this.selectedPersonIds().size === 0) return false;

    if (this.selectedAction() === 'upload-to-everyone') {
      const form = this.uploadForm();
      return form ? form.formData() !== null : false;
    }
    return false;
  });

  ngOnInit(): void {
    const preIds = this.preSelectedPersonIds();
    if (preIds.length > 0) {
      this.selectedPersonIds.set(new Set(preIds));
    } else {
      this.selectedPersonIds.set(new Set(this.persons().map(p => p.id)));
    }
  }

  togglePerson(id: number): void {
    this.selectedPersonIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAllStudents(): void {
    this.selectedPersonIds.update(set => {
      const next = new Set(set);
      const all = this.allStudentsSelected();
      for (const s of this.students()) {
        if (all) next.delete(s.id); else next.add(s.id);
      }
      return next;
    });
  }

  toggleAllTeachers(): void {
    this.selectedPersonIds.update(set => {
      const next = new Set(set);
      const all = this.allTeachersSelected();
      for (const t of this.teachers()) {
        if (all) next.delete(t.id); else next.add(t.id);
      }
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedPersonIds().has(id);
  }

  async onExecute(): Promise<void> {
    if (!this.canExecute()) return;

    this.executing.set(true);
    this.errorMessage.set(null);

    try {
      if (this.selectedAction() === 'upload-to-everyone') {
        await this.executeUploadToEveryone();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(msg);
    } finally {
      this.executing.set(false);
    }
  }

  private async executeUploadToEveryone(): Promise<void> {
    const form = this.uploadForm();
    if (!form) return;

    const formData = form.formData();
    if (!formData) return;

    const selectedIds = this.selectedPersonIds();
    const selectedPersons = this.persons().filter(p => selectedIds.has(p.id));
    if (selectedPersons.length === 0) return;

    const sourceFiles = formData.files.map(f => ({
      filePath: (f as File & { path?: string }).path || f.name,
    }));

    // Shuffle indexek
    const indices = Array.from({ length: sourceFiles.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const layers = selectedPersons.map((p, i) => ({
      layerName: p.layerName,
      group: (p.type === 'teacher' ? 'Teachers' : 'Students') as 'Teachers' | 'Students',
      x: Math.round(p.x),
      y: Math.round(p.y),
      sourceIndex: sourceFiles.length === 1 ? 0 : indices[i % indices.length],
    }));

    const result = await this.ps.addGroupLayers({
      groupName: formData.groupName,
      sourceFiles,
      layers,
    });

    if (!result.success) {
      throw new Error(result.error || 'Ismeretlen hiba tortent');
    }

    this.executed.emit();
  }
}
