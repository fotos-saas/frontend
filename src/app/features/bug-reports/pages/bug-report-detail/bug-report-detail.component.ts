import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { BugReport } from '../../../../shared/types/bug-report.types';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-bug-report-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, RichTextEditorComponent],
  templateUrl: './bug-report-detail.component.html',
  styleUrl: './bug-report-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BugReportDetailComponent implements OnInit {
  private readonly bugReportService = inject(BugReportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  report = signal<BugReport | null>(null);
  loading = signal(true);
  newComment = signal('');
  commentSubmitting = signal(false);
  lightboxImage = signal<string | null>(null);

  private get apiPrefix(): string {
    const url = this.router.url;
    if (url.startsWith('/marketer')) return 'marketer';
    return '';
  }

  private get routePrefix(): string {
    const url = this.router.url;
    if (url.startsWith('/marketer')) return '/marketer';
    if (url.startsWith('/designer')) return '/designer';
    return '/partner';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadReport(id);
  }

  private loadReport(id: number): void {
    this.loading.set(true);
    this.bugReportService.get(this.apiPrefix, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate([this.routePrefix, 'bugs']);
        },
      });
  }

  goBack(): void {
    this.router.navigate([this.routePrefix, 'bugs']);
  }

  submitComment(): void {
    const report = this.report();
    if (!report || !this.newComment().trim()) return;

    this.commentSubmitting.set(true);
    this.bugReportService.addComment(this.apiPrefix, report.id, { content: this.newComment() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.report.update(r => r ? {
            ...r,
            comments: [...(r.comments || []), res.comment]
          } : r);
          this.newComment.set('');
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
