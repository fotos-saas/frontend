import { Component, signal, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PartnerWorkflowService } from '../../services/partner-workflow.service';
import { WorkflowScheduleSettings, WORKFLOW_TYPE_LABELS } from '../../models/workflow.models';

@Component({
  selector: 'app-workflow-schedule-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ConfirmDialogComponent],
  templateUrl: './workflow-schedule-settings.component.html',
  styleUrl: './workflow-schedule-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowScheduleSettingsComponent implements OnInit {
  private workflowService = inject(PartnerWorkflowService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  readonly ICONS = ICONS;
  readonly WORKFLOW_TYPE_LABELS = WORKFLOW_TYPE_LABELS;

  schedules = signal<WorkflowScheduleSettings[]>([]);
  loading = signal(true);
  saving = signal(false);
  showAddForm = signal(false);
  scheduleToDelete = signal<WorkflowScheduleSettings | null>(null);

  newSchedule = signal<WorkflowScheduleSettings>({
    workflow_type: 'photo_swap',
    schedule_time: '22:00',
    is_active: true,
    conditions: { min_changed_photos: 1 },
  });

  ngOnInit(): void {
    this.loadSchedules();
  }

  private loadSchedules(): void {
    this.loading.set(true);
    this.workflowService.getScheduleSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schedules) => {
          this.schedules.set(schedules);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  goBack(): void {
    this.router.navigate(['/partner/workflows']);
  }

  toggleActive(schedule: WorkflowScheduleSettings): void {
    if (!schedule.id) return;
    this.workflowService.updateSchedule(schedule.id, { is_active: !schedule.is_active })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.schedules.update(list =>
            list.map(s => s.id === updated.id ? updated : s),
          );
        },
      });
  }

  confirmDeleteSchedule(schedule: WorkflowScheduleSettings): void {
    this.scheduleToDelete.set(schedule);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    const schedule = this.scheduleToDelete();
    this.scheduleToDelete.set(null);
    if (result.action !== 'confirm' || !schedule?.id) return;

    this.workflowService.deleteSchedule(schedule.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.schedules.update(list => list.filter(s => s.id !== schedule.id));
        },
      });
  }

  saveNewSchedule(): void {
    this.saving.set(true);
    this.workflowService.createSchedule(this.newSchedule())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.schedules.update(list => [...list, created]);
          this.showAddForm.set(false);
          this.saving.set(false);
          this.resetNewSchedule();
        },
        error: () => this.saving.set(false),
      });
  }

  private resetNewSchedule(): void {
    this.newSchedule.set({
      workflow_type: 'photo_swap',
      schedule_time: '22:00',
      is_active: true,
      conditions: { min_changed_photos: 1 },
    });
  }

  updateNewType(type: string): void {
    this.newSchedule.update(s => ({ ...s, workflow_type: type as WorkflowScheduleSettings['workflow_type'] }));
  }

  updateNewTime(time: string): void {
    this.newSchedule.update(s => ({ ...s, schedule_time: time }));
  }

  updateNewMinPhotos(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      this.newSchedule.update(s => ({ ...s, conditions: { ...s.conditions, min_changed_photos: num } }));
    }
  }
}
