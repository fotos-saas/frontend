import { Component, inject, signal, output, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { BugReportPriority, BUG_REPORT_PRIORITY_OPTIONS } from '../../../../shared/types/bug-report.types';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-create-bug-report-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, RichTextEditorComponent],
  templateUrl: './create-bug-report-dialog.component.html',
  styleUrl: './create-bug-report-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateBugReportDialogComponent {
  private readonly bugReportService = inject(BugReportService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly close = output<void>();
  readonly created = output<void>();

  readonly ICONS = ICONS;
  readonly priorityOptions = BUG_REPORT_PRIORITY_OPTIONS;

  title = signal('');
  description = signal('');
  priority = signal<BugReportPriority>('medium');
  attachments = signal<File[]>([]);
  submitting = signal(false);
  error = signal('');

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  private get apiPrefix(): string {
    const url = this.router.url;
    if (url.startsWith('/marketer')) return 'marketer';
    return '';
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const currentFiles = this.attachments();
    const newFiles = Array.from(input.files);
    const combined = [...currentFiles, ...newFiles].slice(0, 5);
    this.attachments.set(combined);
    input.value = '';
  }

  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file && this.attachments().length < 5) {
          this.attachments.update(files => [...files, file]);
        }
      }
    }
  }

  removeAttachment(index: number): void {
    this.attachments.update(files => files.filter((_, i) => i !== index));
  }

  submit(): void {
    if (!this.title().trim() || !this.description().trim()) {
      this.error.set('A cím és a leírás megadása kötelező.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    this.bugReportService.create(
      this.apiPrefix,
      {
        title: this.title().trim(),
        description: this.description(),
        priority: this.priority(),
      },
      this.attachments()
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.created.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.message || 'Hiba történt a bejelentés küldése közben.');
        },
      });
  }
}
