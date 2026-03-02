import { Component, ChangeDetectionStrategy, inject, input, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { PartnerActivityService, ProjectActivityItem } from '../../../../features/partner/services/partner-activity.service';

interface DayGroup {
  date: string;
  label: string;
  items: ProjectActivityItem[];
}

const FIELD_LABELS: Record<string, string> = {
  active_photo_id: 'Aktív fotó',
  name: 'Név',
  email: 'E-mail',
  phone: 'Telefon',
  status: 'Státusz',
  role: 'Szerepkör',
  class_name: 'Osztály',
  school_name: 'Iskola',
  position: 'Pozíció',
  title: 'Cím',
  description: 'Leírás',
  is_active: 'Aktív',
  is_visible: 'Látható',
  order: 'Sorrend',
  price: 'Ár',
  quantity: 'Mennyiség',
  deadline: 'Határidő',
  notes: 'Megjegyzés',
  photo_count: 'Fotók száma',
};

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

  groupedItems = computed<DayGroup[]>(() => {
    const items = this.items();
    const groups = new Map<string, ProjectActivityItem[]>();

    for (const item of items) {
      const dateKey = item.createdAt.substring(0, 10);
      const existing = groups.get(dateKey);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(dateKey, [item]);
      }
    }

    const today = new Date().toISOString().substring(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

    return Array.from(groups.entries()).map(([date, groupItems]) => ({
      date,
      label: date === today ? 'Ma' : date === yesterday ? 'Tegnap' : this.formatDateLabel(date),
      items: groupItems,
    }));
  });

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

  formatFieldName(key: string): string {
    return FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
  }

  getChangeKeys(changes: ProjectActivityItem['changes']): string[] {
    if (!changes) return [];
    const keys = new Set<string>();
    if (changes.attributes) Object.keys(changes.attributes).forEach(k => keys.add(k));
    if (changes.old) Object.keys(changes.old).forEach(k => keys.add(k));
    return Array.from(keys);
  }

  private formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${year}. ${month}. ${day}.`;
  }
}
