import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PartnerTaskService } from '../../services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { ProjectTaskGroup, ProjectTask } from '../../models/partner.models';

@Component({
  selector: 'app-tasks-overview',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './tasks-overview.component.html',
  styleUrls: ['./tasks-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksOverviewComponent implements OnInit {
  private readonly taskService = inject(PartnerTaskService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  groups = signal<ProjectTaskGroup[]>([]);
  loading = signal(true);
  expandedGroups = signal<Set<number>>(new Set());

  totalCompleted = computed(() => this.groups().reduce((sum, g) => sum + g.completed_count, 0));
  totalTasks = computed(() => this.groups().reduce((sum, g) => sum + g.total_count, 0));

  ngOnInit(): void {
    this.loadAllTasks();
  }

  loadAllTasks(): void {
    this.loading.set(true);
    this.taskService.getAllTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.groups.set(res.data);
          // Alapból mindegyik nyitva
          this.expandedGroups.set(new Set(res.data.map(g => g.project_id)));
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült betölteni a feladatokat.');
          this.loading.set(false);
        },
      });
  }

  toggleGroup(projectId: number): void {
    this.expandedGroups.update(set => {
      const next = new Set(set);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  isExpanded(projectId: number): boolean {
    return this.expandedGroups().has(projectId);
  }

  toggleTask(group: ProjectTaskGroup, task: ProjectTask): void {
    // Optimisztikus UI
    const prevGroups = this.groups();
    this.groups.update(groups =>
      groups.map(g => {
        if (g.project_id !== group.project_id) return g;
        const newCompleted = task.is_completed ? g.completed_count - 1 : g.completed_count + 1;
        return {
          ...g,
          completed_count: newCompleted,
          tasks: g.tasks.map(t =>
            t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
          ),
        };
      })
    );

    this.taskService.toggleComplete(group.project_id, task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.groups.update(groups =>
            groups.map(g => {
              if (g.project_id !== group.project_id) return g;
              return {
                ...g,
                tasks: g.tasks.map(t => t.id === task.id ? res.data : t),
                completed_count: g.tasks.filter(t => t.id === task.id ? res.data.is_completed : t.is_completed).length,
              };
            })
          );
        },
        error: () => {
          this.groups.set(prevGroups);
          this.toast.error('Hiba', 'Nem sikerült frissíteni a feladatot.');
        },
      });
  }

  navigateToProject(projectId: number): void {
    const base = this.authService.isMarketer() ? '/marketer' : '/partner';
    this.router.navigateByUrl(`${base}/projects/${projectId}#tasks`);
  }
}
