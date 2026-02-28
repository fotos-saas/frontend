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
import { SafeHtmlPipe } from '../../../../shared/pipes/safe-html.pipe';
import { getFileTypeIcon, formatAttachmentSize } from '../../../../shared/utils/file-type-icon.util';
import { PartnerTaskService } from '../../services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { ProjectTaskGroup, ProjectTask } from '../../models/partner.models';

interface TaskSection {
  key: string;
  title: string;
  icon: string;
  groups: ProjectTaskGroup[];
  completedCount: number;
  totalCount: number;
}

@Component({
  selector: 'app-tasks-overview',
  standalone: true,
  imports: [LucideAngularModule, SafeHtmlPipe],
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
  readonly getFileTypeIcon = getFileTypeIcon;
  readonly formatAttachmentSize = formatAttachmentSize;

  rawGroups = signal<ProjectTaskGroup[]>([]);
  loading = signal(true);
  expandedGroups = signal<Set<string>>(new Set());
  activeTab = signal<string>('');

  currentUserId = computed(() => this.authService.currentUserSignal()?.id ?? 0);

  activeSection = computed(() => {
    const tab = this.activeTab();
    return this.sections().find(s => s.key === tab) ?? null;
  });

  sections = computed<TaskSection[]>(() => {
    const groups = this.rawGroups();
    const uid = this.currentUserId();
    if (!groups.length) return [];

    const myOwn: Map<number, { group: ProjectTaskGroup; tasks: ProjectTask[] }> = new Map();
    const assignedToMe: Map<number, { group: ProjectTaskGroup; tasks: ProjectTask[] }> = new Map();
    const iGaveOthers: Map<number, { group: ProjectTaskGroup; tasks: ProjectTask[] }> = new Map();

    for (const group of groups) {
      for (const task of group.tasks) {
        const createdByMe = task.created_by?.id === uid;
        const assignedToSelf = !task.assigned_to || task.assigned_to.id === uid;
        const assignedToOther = task.assigned_to && task.assigned_to.id !== uid;

        if (createdByMe && assignedToSelf) {
          this.pushToMap(myOwn, group, task);
        } else if (!createdByMe && task.assigned_to?.id === uid) {
          this.pushToMap(assignedToMe, group, task);
        } else if (createdByMe && assignedToOther) {
          this.pushToMap(iGaveOthers, group, task);
        }
      }
    }

    const result: TaskSection[] = [];

    const myOwnGroups = this.mapToGroups(myOwn);
    if (myOwnGroups.length) {
      result.push({
        key: 'my_own',
        title: 'Saját feladataim',
        icon: ICONS.LIST_TODO,
        groups: myOwnGroups,
        completedCount: myOwnGroups.reduce((s, g) => s + g.completed_count, 0),
        totalCount: myOwnGroups.reduce((s, g) => s + g.total_count, 0),
      });
    }

    const assignedGroups = this.mapToGroups(assignedToMe);
    if (assignedGroups.length) {
      result.push({
        key: 'assigned_to_me',
        title: 'Mások adták nekem',
        icon: ICONS.USER_CHECK,
        groups: assignedGroups,
        completedCount: assignedGroups.reduce((s, g) => s + g.completed_count, 0),
        totalCount: assignedGroups.reduce((s, g) => s + g.total_count, 0),
      });
    }

    const gaveOthersGroups = this.mapToGroups(iGaveOthers);
    if (gaveOthersGroups.length) {
      result.push({
        key: 'i_gave_others',
        title: 'Én adtam másnak',
        icon: ICONS.SEND,
        groups: gaveOthersGroups,
        completedCount: gaveOthersGroups.reduce((s, g) => s + g.completed_count, 0),
        totalCount: gaveOthersGroups.reduce((s, g) => s + g.total_count, 0),
      });
    }

    return result;
  });

  totalCompleted = computed(() => this.sections().reduce((s, sec) => s + sec.completedCount, 0));
  totalTasks = computed(() => this.sections().reduce((s, sec) => s + sec.totalCount, 0));

  ngOnInit(): void {
    this.loadAllTasks();
  }

  loadAllTasks(): void {
    this.loading.set(true);
    this.taskService.getAllTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rawGroups.set(res.data);
          // Alapból minden csoport nyitva
          const keys = new Set<string>();
          for (const g of res.data) {
            keys.add(`my_own_${g.project_id}`);
            keys.add(`assigned_to_me_${g.project_id}`);
            keys.add(`i_gave_others_${g.project_id}`);
          }
          this.expandedGroups.set(keys);
          this.loading.set(false);
          // Első tab kiválasztása ha még nincs
          if (!this.activeTab()) {
            const secs = this.sections();
            if (secs.length > 0) {
              this.activeTab.set(secs[0].key);
            }
          }
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült betölteni a feladatokat.');
          this.loading.set(false);
        },
      });
  }

  toggleGroup(sectionKey: string, projectId: number): void {
    const key = `${sectionKey}_${projectId}`;
    this.expandedGroups.update(set => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isExpanded(sectionKey: string, projectId: number): boolean {
    return this.expandedGroups().has(`${sectionKey}_${projectId}`);
  }

  toggleTask(group: ProjectTaskGroup, task: ProjectTask): void {
    const prev = this.rawGroups();
    this.rawGroups.update(groups =>
      groups.map(g => {
        if (g.project_id !== group.project_id) return g;
        return {
          ...g,
          completed_count: task.is_completed ? g.completed_count - 1 : g.completed_count + 1,
          tasks: g.tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t),
        };
      })
    );

    this.taskService.toggleComplete(group.project_id, task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rawGroups.update(groups =>
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
          this.rawGroups.set(prev);
          this.toast.error('Hiba', 'Nem sikerült frissíteni a feladatot.');
        },
      });
  }

  navigateToProject(projectId: number): void {
    const base = this.authService.isMarketer() ? '/marketer' : '/partner';
    this.router.navigateByUrl(`${base}/projects/${projectId}#tasks`);
  }

  private pushToMap(map: Map<number, { group: ProjectTaskGroup; tasks: ProjectTask[] }>, group: ProjectTaskGroup, task: ProjectTask): void {
    const existing = map.get(group.project_id);
    if (existing) {
      existing.tasks.push(task);
    } else {
      map.set(group.project_id, { group, tasks: [task] });
    }
  }

  private mapToGroups(map: Map<number, { group: ProjectTaskGroup; tasks: ProjectTask[] }>): ProjectTaskGroup[] {
    return [...map.values()].map(({ group, tasks }) => ({
      project_id: group.project_id,
      project_name: group.project_name,
      school_name: group.school_name,
      tasks,
      completed_count: tasks.filter(t => t.is_completed).length,
      total_count: tasks.length,
    }));
  }
}
