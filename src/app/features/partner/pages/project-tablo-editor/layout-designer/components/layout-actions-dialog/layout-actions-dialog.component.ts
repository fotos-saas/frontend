import {
  Component, ChangeDetectionStrategy, input, output, signal, computed, inject, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsSelectComponent } from '@shared/components/form/ps-select/ps-select.component';
import { PsMultiSelectBoxComponent } from '@shared/components/form/ps-multi-select-box/ps-multi-select-box.component';
import { PsSelectOption } from '@shared/components/form/form.types';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { PhotoshopService } from '../../../../../services/photoshop.service';
import { ActionPersonItem, ActionConfig } from './layout-actions.types';
import {
  UploadToEveryoneFormComponent,
  UploadToEveryoneFormData,
} from './actions/upload-to-everyone-form.component';

const ACTIONS: ActionConfig[] = [
  { id: 'upload-to-everyone', label: 'Kepek feltoltese mindenkihez', icon: 'upload' },
];

@Component({
  selector: 'app-layout-actions-dialog',
  standalone: true,
  imports: [
    FormsModule, LucideAngularModule, PsSelectComponent,
    PsMultiSelectBoxComponent, UploadToEveryoneFormComponent,
  ],
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
  readonly selectedPersonIds = signal<(string | number)[]>([]);
  readonly executing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly uploadForm = viewChild<UploadToEveryoneFormComponent>('uploadForm');

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly actionOptions = computed<PsSelectOption[]>(() =>
    ACTIONS.map(a => ({ id: a.id, label: a.label }))
  );

  readonly personOptions = computed<PsSelectOption[]>(() =>
    this.persons().map(p => ({
      id: p.id,
      label: p.name,
      sublabel: p.type === 'teacher' ? 'Tanar' : 'Diak',
    }))
  );

  readonly canExecute = computed(() => {
    if (this.executing()) return false;
    if (this.selectedPersonIds().length === 0) return false;

    if (this.selectedAction() === 'upload-to-everyone') {
      const form = this.uploadForm();
      return form ? form.formData() !== null : false;
    }
    return false;
  });

  ngOnInit(): void {
    // Pre-szelektalt szemelyek beallitasa
    const preIds = this.preSelectedPersonIds();
    if (preIds.length > 0) {
      this.selectedPersonIds.set([...preIds]);
    } else {
      // Ha nincs kijeloles, mindenkit kivalasztunk
      this.selectedPersonIds.set(this.persons().map(p => p.id));
    }
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

    const selectedIds = new Set(this.selectedPersonIds().map(Number));
    const selectedPersons = this.persons().filter(p => selectedIds.has(p.id));

    if (selectedPersons.length === 0) return;

    // Source files — fajl eleresi utvonalak (Electron File.path)
    const sourceFiles = formData.files.map(f => ({
      filePath: (f as File & { path?: string }).path || f.name,
    }));

    // Shuffle indexek (random sorrendben)
    const indices = Array.from({ length: sourceFiles.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Layer kiosztás
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
