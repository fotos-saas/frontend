import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

@Component({
  selector: 'app-project-task-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      [title]="editTask() ? 'Feladat szerkesztése' : 'Új feladat'"
      [icon]="ICONS.LIST_TODO"
      headerStyle="flat"
      theme="blue"
      size="sm"
      [isSubmitting]="saving()"
      (closeEvent)="close.emit()"
      (submitEvent)="save()"
      (backdropClickEvent)="close.emit()">
      <div dialogBody>
        <div class="field">
          <label class="field__label" for="taskTitle">Cím *</label>
          <input
            id="taskTitle"
            type="text"
            class="field__input"
            [(ngModel)]="title"
            placeholder="Feladat címe"
            maxlength="255"
            autofocus
          />
        </div>
        <div class="field">
          <label class="field__label" for="taskDesc">Leírás</label>
          <textarea
            id="taskDesc"
            class="field__input field__textarea"
            [(ngModel)]="description"
            placeholder="Opcionális leírás..."
            maxlength="2000"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div dialogFooter>
        <button class="btn btn--outline" (click)="close.emit()">Mégse</button>
        <button
          class="btn btn--primary"
          [disabled]="saving() || !title.trim()"
          (click)="save()">
          @if (saving()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
          }
          {{ editTask() ? 'Mentés' : 'Létrehozás' }}
        </button>
      </div>
    </app-dialog-wrapper>
  `,
  styles: [`
    .field {
      margin-bottom: 14px;

      &__label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #475569;
        margin-bottom: 4px;
      }

      &__input {
        width: 100%;
        padding: 8px 12px;
        font-size: 0.875rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        outline: none;
        transition: border-color 0.15s ease;

        &:focus {
          border-color: var(--color-primary, #1e3a5f);
        }
      }

      &__textarea {
        resize: vertical;
        min-height: 60px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition-duration: 0.01ms !important; }
    }
  `],
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
  title = '';
  description = '';

  ngOnInit(): void {
    const task = this.editTask();
    if (task) {
      this.title = task.title;
      this.description = task.description ?? '';
    }
  }

  save(): void {
    if (!this.title.trim()) return;

    this.saving.set(true);
    const data = { title: this.title.trim(), description: this.description.trim() || null };
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
