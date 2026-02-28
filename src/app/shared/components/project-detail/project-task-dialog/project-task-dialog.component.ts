import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent } from '../../form/ps-input/ps-input.component';
import { PsEditorComponent } from '../../form/ps-editor/ps-editor.component';
import { PsSelectComponent } from '../../form/ps-select/ps-select.component';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { PsSelectOption } from '../../form/form.types';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

@Component({
  selector: 'app-project-task-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsInputComponent, PsEditorComponent, PsSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-task-dialog.component.html',
  styleUrls: ['./project-task-dialog.component.scss'],
})
export class ProjectTaskDialogComponent implements OnInit {
  projectId = input.required<number>();
  editTask = input<ProjectTask | null>(null);
  close = output<void>();
  saved = output<ProjectTask>();

  private readonly taskService = inject(PartnerTaskService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  saving = signal(false);
  assigneeOptions = signal<PsSelectOption[]>([]);
  title = '';
  description = '';
  assignedToUserId: string | number = '';

  readonly canSave = computed(() => !this.saving() && this.title.trim().length > 0);

  ngOnInit(): void {
    const task = this.editTask();
    if (task) {
      this.title = task.title;
      this.description = task.description ?? '';
      this.assignedToUserId = task.assigned_to?.id ?? '';
    }

    this.loadAssignees();
  }

  private loadAssignees(): void {
    this.taskService.getAssignees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.assigneeOptions.set(
            res.data.map(a => ({ id: a.id, label: a.name, sublabel: this.roleLabel(a.role) }))
          );
        },
        error: () => {
          this.assigneeOptions.set([]);
        },
      });
  }

  private roleLabel(role: string): string {
    const labels: Record<string, string> = {
      partner: 'Partner',
      designer: 'Grafikus',
      marketer: 'Ügyintéző',
      printer: 'Nyomdász',
      assistant: 'Asszisztens',
    };
    return labels[role] ?? role;
  }

  save(): void {
    if (!this.title.trim()) return;

    this.saving.set(true);
    const data: { title: string; description: string | null; assigned_to_user_id: number | null } = {
      title: this.title.trim(),
      description: this.description.trim() || null,
      assigned_to_user_id: this.assignedToUserId ? Number(this.assignedToUserId) : null,
    };
    const editing = this.editTask();

    const obs = editing
      ? this.taskService.updateTask(this.projectId(), editing.id, data)
      : this.taskService.createTask(this.projectId(), data);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success('Siker', editing ? 'Feladat frissítve.' : 'Feladat létrehozva.');
        this.saved.emit(res.data);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a feladatot.');
      },
    });
  }
}
