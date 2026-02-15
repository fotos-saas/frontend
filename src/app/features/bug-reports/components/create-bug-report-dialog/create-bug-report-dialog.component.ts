import { Component, inject, signal, output, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { BugReportPriority, BUG_REPORT_PRIORITY_OPTIONS } from '../../../../shared/types/bug-report.types';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent, PsSelectComponent, PsFileUploadComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';

@Component({
  selector: 'app-create-bug-report-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, RichTextEditorComponent, DialogWrapperComponent, PsInputComponent, PsSelectComponent, PsFileUploadComponent],
  templateUrl: './create-bug-report-dialog.component.html',
  styleUrl: './create-bug-report-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateBugReportDialogComponent {
  private readonly bugReportService = inject(BugReportService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly close = output<void>();
  readonly created = output<void>();

  readonly ICONS = ICONS;
  readonly priorityOptions = BUG_REPORT_PRIORITY_OPTIONS;
  readonly prioritySelectOptions: PsSelectOption[] = BUG_REPORT_PRIORITY_OPTIONS.map(o => ({ id: o.value, label: o.label }));

  title = signal('');
  description = signal('');
  priority = signal<BugReportPriority>('medium');
  attachments = signal<File[]>([]);
  submitting = signal(false);
  error = signal('');

  private get apiPrefix(): string {
    const url = this.router.url;
    if (url.startsWith('/marketer')) return 'marketer';
    return '';
  }

  onUploadError(message: string): void {
    this.toast.error('Hiba', message);
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
