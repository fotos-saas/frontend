import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

@Component({
  selector: 'app-project-tasks-tab',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './project-tasks-tab.component.html',
  styleUrls: ['./project-tasks-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTasksTabComponent implements OnInit {
  projectId = input.required<number>();

  /** Dialógus kérés: null = új, ProjectTask = szerkesztés */
  dialogRequested = output<ProjectTask | null>();
  /** Törlés kérés */
  deleteRequested = output<ProjectTask>();

  private readonly taskService = inject(PartnerTaskService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  myTasks = signal<ProjectTask[]>([]);
  assignedToMe = signal<ProjectTask[]>([]);
  loading = signal(true);

  completedCount = computed(() => {
    const all = [...this.myTasks(), ...this.assignedToMe()];
    return all.filter(t => t.is_completed).length;
  });
  totalCount = computed(() => this.myTasks().length + this.assignedToMe().length);

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getProjectTasks(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.myTasks.set(res.data.my_tasks);
          this.assignedToMe.set(res.data.assigned_to_me);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült betölteni a feladatokat.');
          this.loading.set(false);
        },
      });
  }

  toggleTask(task: ProjectTask, section: 'my' | 'assigned'): void {
    const signalRef = section === 'my' ? this.myTasks : this.assignedToMe;
    const prev = signalRef();

    signalRef.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t)
    );

    this.taskService.toggleComplete(this.projectId(), task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          signalRef.update(tasks =>
            tasks.map(t => t.id === task.id ? res.data : t)
          );
        },
        error: () => {
          signalRef.set(prev);
          this.toast.error('Hiba', 'Nem sikerült frissíteni a feladatot.');
        },
      });
  }

  /** Wrapper hívja a dialógus saved után */
  onTaskSaved(task: ProjectTask, wasEdit: boolean): void {
    // Újratöltjük a szekciós listát, mert kiosztás változhatott
    this.loadTasks();
  }

  /** Wrapper hívja a törlés confirm után */
  executeDelete(task: ProjectTask): void {
    this.taskService.deleteTask(this.projectId(), task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.myTasks.update(tasks => tasks.filter(t => t.id !== task.id));
          this.assignedToMe.update(tasks => tasks.filter(t => t.id !== task.id));
          this.toast.success('Siker', 'Feladat törölve.');
        },
        error: () => this.toast.error('Hiba', 'Nem sikerült törölni a feladatot.'),
      });
  }
}
