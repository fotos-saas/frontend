import { Component, ChangeDetectionStrategy, OnInit, input, output, signal, computed, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PsEditorComponent } from '../../form/ps-editor/ps-editor.component';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

@Component({
  selector: 'app-project-task-answer-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-task-answer-dialog.component.html',
  styleUrls: ['./project-task-answer-dialog.component.scss'],
})
export class ProjectTaskAnswerDialogComponent implements OnInit {
  projectId = input.required<number>();
  task = input.required<ProjectTask>();
  close = output<void>();
  saved = output<ProjectTask>();

  private readonly taskService = inject(PartnerTaskService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  saving = signal(false);
  answerText = '';
  isEdit = false;

  ngOnInit(): void {
    const existing = this.task().answer;
    if (existing) {
      this.answerText = existing;
      this.isEdit = true;
    }
  }

  readonly canSave = computed(() => !this.saving() && this.answerText.trim().length > 0);

  save(): void {
    if (!this.answerText.trim()) return;

    this.saving.set(true);
    this.taskService.answerQuestion(this.projectId(), this.task().id, this.answerText.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Siker', 'Válasz mentve.');
          this.saved.emit(res.data);
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Hiba', 'Nem sikerült menteni a választ.');
        },
      });
  }
}
