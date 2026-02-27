import { Component, ChangeDetectionStrategy, inject, input, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { PartnerActivityService, ProjectActivityItem } from '../../../../features/partner/services/partner-activity.service';

@Component({
  selector: 'app-project-activity-tab',
  standalone: true,
  imports: [LucideAngularModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-activity-tab.component.html',
  styleUrl: './project-activity-tab.component.scss',
})
export class ProjectActivityTabComponent implements OnInit {
  projectId = input.required<number>();

  private readonly activityService = inject(PartnerActivityService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly items = signal<ProjectActivityItem[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);

  ngOnInit(): void {
    this.loadActivity();
  }

  loadActivity(page = 1): void {
    this.loading.set(true);
    this.activityService.getProjectActivity(this.projectId(), page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.currentPage.set(res.pagination.current_page);
          this.lastPage.set(res.pagination.last_page);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  loadMore(): void {
    if (this.currentPage() >= this.lastPage()) return;
    const nextPage = this.currentPage() + 1;
    this.activityService.getProjectActivity(this.projectId(), nextPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.update(prev => [...prev, ...res.items]);
          this.currentPage.set(res.pagination.current_page);
          this.lastPage.set(res.pagination.last_page);
        },
      });
  }

  getEventIcon(event: string | null): string {
    switch (event) {
      case 'created': return ICONS.PLUS;
      case 'updated': return ICONS.EDIT;
      case 'deleted': return ICONS.DELETE;
      default: return ICONS.ACTIVITY;
    }
  }

  getEventColor(event: string | null): string {
    switch (event) {
      case 'created': return '#22c55e';
      case 'updated': return '#3b82f6';
      case 'deleted': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  formatChangeValue(value: unknown): string {
    if (value === null || value === undefined) return '–';
    if (typeof value === 'boolean') return value ? 'Igen' : 'Nem';
    return String(value);
  }

  getChangeKeys(changes: ProjectActivityItem['changes']): string[] {
    if (!changes) return [];
    const keys = new Set<string>();
    if (changes.attributes) Object.keys(changes.attributes).forEach(k => keys.add(k));
    if (changes.old) Object.keys(changes.old).forEach(k => keys.add(k));
    return Array.from(keys);
  }
}
