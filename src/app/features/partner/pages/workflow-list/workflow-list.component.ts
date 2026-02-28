import { Component, signal, computed, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { ICONS } from '@shared/constants/icons.constants';
import { SmartFilterBarComponent, SearchConfig, FilterConfig } from '@shared/components/smart-filter-bar';
import { ListPaginationComponent } from '@shared/components/list-pagination/list-pagination.component';
import { useFilterState } from '@shared/utils/use-filter-state';
import { PartnerWorkflowService } from '../../services/partner-workflow.service';
import {
  WorkflowListItem,
  WorkflowStatus,
  WORKFLOW_TYPE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from '../../models/workflow.models';
import { WorkflowStatusBadgeComponent } from '../../components/workflow-status-badge/workflow-status-badge.component';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, SmartFilterBarComponent, ListPaginationComponent, WorkflowStatusBadgeComponent],
  templateUrl: './workflow-list.component.html',
  styleUrl: './workflow-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowListComponent implements OnInit {
  private workflowService = inject(PartnerWorkflowService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  readonly ICONS = ICONS;

  items = signal<WorkflowListItem[]>([]);
  total = signal(0);
  lastPage = signal(1);
  private loadSub?: Subscription;

  readonly searchConfig: SearchConfig = {
    placeholder: 'Keresés...',
  };

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'workflows' },
    defaultFilters: { status: '', type: '' },
    defaultSortBy: 'created_at',
    defaultSortDir: 'desc',
    onStateChange: () => this.loadData(),
  });

  readonly filterConfigs = signal<FilterConfig[]>([
    {
      id: 'status',
      label: 'Státusz',
      icon: 'activity',
      options: [
        { value: '', label: 'Mind' },
        { value: 'pending', label: 'Várakozik' },
        { value: 'running', label: 'Fut' },
        { value: 'awaiting_approval', label: 'Jóváhagyásra vár' },
        { value: 'completed', label: 'Befejezve' },
        { value: 'failed', label: 'Hiba' },
      ],
    },
    {
      id: 'type',
      label: 'Típus',
      icon: 'layers',
      options: [
        { value: '', label: 'Mind' },
        { value: 'photo_swap', label: 'Fotócsere' },
        { value: 'finalization', label: 'Véglegesítés' },
        { value: 'reminder', label: 'Emlékeztető' },
      ],
    },
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadSub?.unsubscribe();
    this.filterState.loading.set(true);

    const f = this.filterState.filters();
    const params: Record<string, string | number> = {
      page: this.filterState.page(),
      per_page: 20,
    };
    if (f['status']) params['status'] = f['status'];
    if (f['type']) params['type'] = f['type'];

    // A lista oldal nem projekthez kötött — minden workflow
    this.loadSub = this.workflowService.getAllWorkflows(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.lastPage.set(res.meta.last_page);
          this.total.set(res.meta.total);
          this.filterState.loading.set(false);
        },
        error: () => {
          this.filterState.loading.set(false);
        },
      });
  }

  goToDetail(workflow: WorkflowListItem): void {
    this.router.navigate(['/partner/workflows', workflow.id]);
  }

  goToSettings(): void {
    this.router.navigate(['/partner/workflows/settings']);
  }

  getTypeLabel(type: string): string {
    return WORKFLOW_TYPE_LABELS[type as keyof typeof WORKFLOW_TYPE_LABELS] ?? type;
  }

  getTriggerLabel(trigger: string): string {
    switch (trigger) {
      case 'manual': return 'Kézi';
      case 'schedule': return 'Ütemezett';
      case 'event': return 'Automatikus';
      default: return trigger;
    }
  }
}
