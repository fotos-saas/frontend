import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherUploadHistoryDay } from '../../models/teacher.models';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { saveFile } from '../../../../shared/utils/file.util';

@Component({
  selector: 'app-teacher-upload-history',
  standalone: true,
  imports: [
    DatePipe,
    LucideAngularModule,
    MatTooltipModule,
    ListPaginationComponent,
  ],
  templateUrl: './teacher-upload-history.component.html',
  styleUrl: './teacher-upload-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherUploadHistoryComponent implements OnInit {
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  days = signal<TeacherUploadHistoryDay[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  totalDays = signal(0);
  unseenCount = signal(0);

  expandedDates = signal<string[]>([]);
  downloadingDate = signal<string | null>(null);
  markingDate = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.teacherService.getUploadHistory({
      page: this.currentPage(),
      per_page: 30,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.days.set(res.days);
          this.totalPages.set(res.pagination.lastPage);
          this.totalDays.set(res.pagination.total);
          this.unseenCount.set(res.unseenCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.expandedDates.set([]);
    this.loadHistory();
  }

  toggleDay(date: string): void {
    const current = this.expandedDates();
    if (current.includes(date)) {
      this.expandedDates.set(current.filter(d => d !== date));
    } else {
      this.expandedDates.set([...current, date]);
    }
  }

  isDayExpanded(date: string): boolean {
    return this.expandedDates().includes(date);
  }

  markSeen(day: TeacherUploadHistoryDay, event: MouseEvent): void {
    event.stopPropagation();
    if (this.markingDate()) return;

    this.markingDate.set(day.date);

    // Optimisztikus UI update
    this.days.update(days =>
      days.map(d => d.date === day.date ? { ...d, isNew: false } : d)
    );
    this.unseenCount.update(c => Math.max(0, c - 1));

    this.teacherService.markUploadSeen(day.date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.markingDate.set(null),
        error: () => {
          // Rollback
          this.days.update(days =>
            days.map(d => d.date === day.date ? { ...d, isNew: true } : d)
          );
          this.unseenCount.update(c => c + 1);
          this.markingDate.set(null);
        },
      });
  }

  downloadZip(day: TeacherUploadHistoryDay, event: MouseEvent): void {
    event.stopPropagation();
    if (this.downloadingDate()) return;

    this.downloadingDate.set(day.date);

    this.teacherService.downloadUploadZip(day.date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          saveFile(blob, `tanar-feltoltesek-${day.date}.zip`);
          this.downloadingDate.set(null);
        },
        error: () => this.downloadingDate.set(null),
      });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
