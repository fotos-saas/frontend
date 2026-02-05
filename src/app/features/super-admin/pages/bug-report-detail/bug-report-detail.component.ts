import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import {
  BugReport,
  BugReportStatus,
  BUG_REPORT_STATUS_OPTIONS,
  BUG_REPORT_PRIORITY_OPTIONS,
} from '../../../../shared/types/bug-report.types';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-admin-bug-report-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, RichTextEditorComponent],
  templateUrl: './bug-report-detail.component.html',
  styleUrl: './bug-report-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBugReportDetailComponent implements OnInit {
  private readonly bugReportService = inject(BugReportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly statusOptions = BUG_REPORT_STATUS_OPTIONS;
  readonly priorityOptions = BUG_REPORT_PRIORITY_OPTIONS;

  report = signal<BugReport | null>(null);
  loading = signal(true);
  newComment = signal('');
  isInternal = signal(false);
  commentSubmitting = signal(false);
  statusNote = signal('');
  lightboxImage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadReport(id);
  }

  private loadReport(id: number): void {
    this.loading.set(true);
    this.bugReportService.getAdmin(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/super-admin', 'bugs']);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/super-admin', 'bugs']);
  }

  changeStatus(newStatus: BugReportStatus): void {
    const report = this.report();
    if (!report) return;

    this.bugReportService.updateStatus(report.id, {
      status: newStatus,
      note: this.statusNote() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.report.update(r => r ? { ...r, status: res.status as BugReportStatus, status_label: res.status_label } : r);
          this.statusNote.set('');
          this.loadReport(report.id);
        },
      });
  }

  changePriority(priority: string): void {
    const report = this.report();
    if (!report) return;

    this.bugReportService.updatePriority(report.id, priority)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.report.update(r => r ? { ...r, priority: res.priority as any, priority_label: res.priority_label } : r);
        },
      });
  }

  submitComment(): void {
    const report = this.report();
    if (!report || !this.newComment().trim()) return;

    this.commentSubmitting.set(true);
    this.bugReportService.addCommentAdmin(report.id, {
      content: this.newComment(),
      is_internal: this.isInternal(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.report.update(r => r ? {
            ...r,
            comments: [...(r.comments || []), res.comment]
          } : r);
          this.newComment.set('');
          this.isInternal.set(false);
          this.commentSubmitting.set(false);
        },
        error: () => this.commentSubmitting.set(false),
      });
  }

  openLightbox(url: string): void {
    this.lightboxImage.set(url);
  }

  closeLightbox(): void {
    this.lightboxImage.set(null);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'new': return 'badge--new';
      case 'in_progress': return 'badge--progress';
      case 'resolved': return 'badge--resolved';
      case 'closed': return 'badge--closed';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'badge--critical';
      case 'high': return 'badge--high';
      case 'medium': return 'badge--medium';
      case 'low': return 'badge--low';
      default: return '';
    }
  }
}
