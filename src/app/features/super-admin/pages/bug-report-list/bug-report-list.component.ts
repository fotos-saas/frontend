import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import {
  BugReport,
  BUG_REPORT_STATUS_OPTIONS,
  BUG_REPORT_PRIORITY_OPTIONS,
} from '../../../../shared/types/bug-report.types';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';

@Component({
  selector: 'app-admin-bug-report-list',
  standalone: true,
  imports: [FormsModule, DatePipe, LucideAngularModule, PsSelectComponent, ListPaginationComponent],
  templateUrl: './bug-report-list.component.html',
  styleUrl: './bug-report-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBugReportListComponent implements OnInit {
  private readonly bugReportService = inject(BugReportService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;
  readonly statusOptions = BUG_REPORT_STATUS_OPTIONS;
  readonly priorityOptions = BUG_REPORT_PRIORITY_OPTIONS;

  readonly statusSelectOptions: PsSelectOption[] = BUG_REPORT_STATUS_OPTIONS.map(o => ({ id: o.value, label: o.label }));
  readonly prioritySelectOptions: PsSelectOption[] = BUG_REPORT_PRIORITY_OPTIONS.map(o => ({ id: o.value, label: o.label }));

  reports = signal<BugReport[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  search = signal('');
  statusFilter = signal('');
  priorityFilter = signal('');
  unreadOnly = signal(false);

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);

    const params: Record<string, string> = {
      page: this.currentPage().toString(),
      per_page: '15',
    };
    if (this.search()) params['search'] = this.search();
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.priorityFilter()) params['priority'] = this.priorityFilter();
    if (this.unreadOnly()) params['unread_only'] = '1';

    this.bugReportService.listAdmin(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.reports.set(res.data);
          this.totalPages.set(res.last_page);
          this.totalItems.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  onPriorityFilterChange(value: string): void {
    this.priorityFilter.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  toggleUnreadOnly(): void {
    this.unreadOnly.update(v => !v);
    this.currentPage.set(1);
    this.loadReports();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadReports();
  }

  openReport(report: BugReport): void {
    this.router.navigate(['/super-admin', 'bugs', report.id]);
  }

  isUnread(report: BugReport): boolean {
    return !report.first_viewed_at;
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
