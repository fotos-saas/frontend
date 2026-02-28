import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  input,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

@Component({
  selector: 'app-project-tasks-tab',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, DialogWrapperComponent, ConfirmDialogComponent],
  templateUrl: './project-tasks-tab.component.html',
  styleUrls: ['./project-tasks-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTasksTabComponent implements OnInit {
  projectId = input.required<number>();

  private readonly taskService = inject(PartnerTaskService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // State
  tasks = signal<ProjectTask[]>([]);
  loading = signal(true);

  // Dialog
  showDialog = signal(false);
  editingTask = signal<ProjectTask | null>(null);
  dialogTitle = '';
  dialogDescription = '';
  saving = signal(false);

  // Delete confirm
  showDeleteConfirm = signal(false);
  deletingTask = signal<ProjectTask | null>(null);

  // Computed
  completedCount = computed(() => this.tasks().filter(t => t.is_completed).length);
  totalCount = computed(() => this.tasks().length);

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getProjectTasks(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tasks.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült betölteni a feladatokat.');
          this.loading.set(false);
        },
      });
  }

  // === TOGGLE ===

  toggleTask(task: ProjectTask): void {
    // Optimisztikus UI
    const prev = this.tasks();
    this.tasks.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t)
    );

    this.taskService.toggleComplete(this.projectId(), task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tasks.update(tasks =>
            tasks.map(t => t.id === task.id ? res.data : t)
          );
        },
        error: () => {
          this.tasks.set(prev);
          this.toast.error('Hiba', 'Nem sikerült frissíteni a feladatot.');
        },
      });
  }

  // === DIALOG ===

  openCreateDialog(): void {
    this.editingTask.set(null);
    this.dialogTitle = '';
    this.dialogDescription = '';
    this.showDialog.set(true);
  }

  openEditDialog(task: ProjectTask): void {
    this.editingTask.set(task);
    this.dialogTitle = task.title;
    this.dialogDescription = task.description ?? '';
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.editingTask.set(null);
  }

  saveTask(): void {
    const title = this.dialogTitle.trim();
    if (!title) return;

    this.saving.set(true);
    const data = { title, description: this.dialogDescription.trim() || null };
    const editing = this.editingTask();

    const obs = editing
      ? this.taskService.updateTask(this.projectId(), editing.id, data)
      : this.taskService.createTask(this.projectId(), data);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (editing) {
          this.tasks.update(tasks => tasks.map(t => t.id === editing.id ? res.data : t));
          this.toast.success('Siker', 'Feladat frissítve.');
        } else {
          this.tasks.update(tasks => [res.data, ...tasks]);
          this.toast.success('Siker', 'Feladat létrehozva.');
        }
        this.saving.set(false);
        this.closeDialog();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a feladatot.');
      },
    });
  }

  // === DELETE ===

  confirmDelete(task: ProjectTask): void {
    this.deletingTask.set(task);
    this.showDeleteConfirm.set(true);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const task = this.deletingTask();
      if (!task) return;

      this.taskService.deleteTask(this.projectId(), task.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.tasks.update(tasks => tasks.filter(t => t.id !== task.id));
            this.toast.success('Siker', 'Feladat törölve.');
          },
          error: () => this.toast.error('Hiba', 'Nem sikerült törölni a feladatot.'),
        });
    }
    this.showDeleteConfirm.set(false);
    this.deletingTask.set(null);
  }
}
