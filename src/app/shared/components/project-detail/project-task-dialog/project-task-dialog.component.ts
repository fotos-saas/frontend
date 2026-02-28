import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent } from '../../form/ps-input/ps-input.component';
import { PsEditorComponent } from '../../form/ps-editor/ps-editor.component';
import { PsSelectComponent } from '../../form/ps-select/ps-select.component';
import { PsFileUploadComponent } from '../../form/ps-file-upload/ps-file-upload.component';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getFileTypeIcon, formatAttachmentSize } from '../../../utils/file-type-icon.util';
import type { PsSelectOption } from '../../form/form.types';
import type { ProjectTask, TaskAttachment } from '../../../../features/partner/models/partner.models';

@Component({
  selector: 'app-project-task-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsInputComponent, PsEditorComponent, PsSelectComponent, PsFileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-task-dialog.component.html',
  styleUrls: ['./project-task-dialog.component.scss'],
})
export class ProjectTaskDialogComponent implements OnInit, OnDestroy {
  projectId = input.required<number>();
  editTask = input<ProjectTask | null>(null);
  close = output<void>();
  saved = output<ProjectTask>();

  private readonly taskService = inject(PartnerTaskService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly pasteHandler = this.onPaste.bind(this);

  readonly ICONS = ICONS;
  saving = signal(false);
  assigneeOptions = signal<PsSelectOption[]>([]);
  title = '';
  description = '';
  assignedToUserId: string | number = '';

  // Csatolmányok
  newAttachments = signal<File[]>([]);
  existingAttachments = signal<TaskAttachment[]>([]);
  removedAttachmentIds: number[] = [];

  readonly canSave = computed(() => !this.saving() && this.title.trim().length > 0);

  readonly getFileTypeIcon = getFileTypeIcon;
  readonly formatAttachmentSize = formatAttachmentSize;

  ngOnInit(): void {
    const task = this.editTask();
    if (task) {
      this.title = task.title;
      this.description = task.description ?? '';
      this.assignedToUserId = task.assigned_to?.id ?? '';
      this.existingAttachments.set(task.attachments ?? []);
    }

    this.loadAssignees();

    // Document-szintű paste listener — elkapja a Cmd+V / Ctrl+V-t bárhol a dialógusban
    this.doc.addEventListener('paste', this.pasteHandler);
  }

  ngOnDestroy(): void {
    this.doc.removeEventListener('paste', this.pasteHandler);
  }

  /** Cmd+V / Ctrl+V clipboard paste — kép fájl hozzáadása */
  private onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Generálunk nevet ha a clipboard nem adott
          const ext = file.type.split('/')[1] || 'png';
          const named = new File([file], `beillesztett-kép-${Date.now()}.${ext}`, { type: file.type });
          imageFiles.push(named);
        }
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault();
      const current = this.newAttachments();
      const existingCount = this.existingAttachments().length - this.removedAttachmentIds.length;
      const totalAfter = current.length + existingCount + imageFiles.length;

      if (totalAfter > 5) {
        this.toast.error('Hiba', 'Maximum 5 csatolmány engedélyezett.');
        return;
      }

      this.newAttachments.set([...current, ...imageFiles]);
    }
  }

  onFilesChanged(files: File[]): void {
    this.newAttachments.set(files);
  }

  onUploadError(msg: string): void {
    this.toast.error('Feltöltési hiba', msg);
  }

  removeExistingAttachment(att: TaskAttachment): void {
    this.removedAttachmentIds.push(att.id);
    this.existingAttachments.update(list => list.filter(a => a.id !== att.id));
  }

  remainingSlots(): number {
    const existing = this.existingAttachments().length;
    return 5 - existing;
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
    const files = this.newAttachments();

    const obs = editing
      ? this.taskService.updateTask(this.projectId(), editing.id, data, files, this.removedAttachmentIds)
      : this.taskService.createTask(this.projectId(), data, files);

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
