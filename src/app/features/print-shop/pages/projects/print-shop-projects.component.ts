import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopProject, PrintShopStudio, PaginatedResponse } from '../../models/print-shop.models';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SamplesLightboxComponent, SampleLightboxItem } from '@shared/components/samples-lightbox';
import { WebsocketService } from '@core/services/websocket.service';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import { ICONS } from '@shared/constants/icons.constants';
import { Subject, debounceTime, distinctUntilChanged, interval } from 'rxjs';

@Component({
  selector: 'app-print-shop-projects',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, MatTooltipModule, RouterModule, ConfirmDialogComponent, SamplesLightboxComponent],
  templateUrl: './print-shop-projects.component.html',
  styleUrls: ['./print-shop-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopProjectsComponent {
  private service = inject(PrintShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  readonly ICONS = ICONS;

  // State
  projects = signal<PrintShopProject[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  lastPage = signal(1);
  perPage = signal(20);

  // Filters
  statusFilter = signal<'in_print' | 'done' | ''>('in_print');
  classYearFilter = signal<string>(new Date().getFullYear().toString());
  studioFilter = signal<number | null>(null);
  searchQuery = signal('');
  projectIdFilter = signal<number | null>(null);
  studios = signal<PrintShopStudio[]>([]);
  availableYears = signal<string[]>(this.getRecentYears());

  // Kijelölés
  selectedIds = signal<Set<number>>(new Set());
  lastClickedIndex = signal<number | null>(null);
  batchDownloading = signal(false);

  // Computed
  selectedCount = computed(() => this.selectedIds().size);
  allSelected = computed(() => {
    const downloadable = this.projects().filter(p => p.hasPrintFile);
    return downloadable.length > 0 && downloadable.every(p => this.selectedIds().has(p.id));
  });
  selectedDownloadable = computed(() =>
    this.projects().filter(p => this.selectedIds().has(p.id) && p.hasPrintFile)
  );

  // Mark-done / revert state
  markingDone = signal<number | null>(null);
  reverting = signal<number | null>(null);

  // Confirm dialog
  showConfirmDialog = signal(false);
  confirmProject = signal<PrintShopProject | null>(null);
  confirmAction = signal<'mark_done' | 'revert'>('mark_done');

  // Lightbox
  lightboxSamples = signal<SampleLightboxItem[]>([]);
  lightboxIndex = signal<number | null>(null);

  // Search debounce
  private searchSubject = new Subject<string>();

  // Computed
  hasFilters = computed(() =>
    this.statusFilter() !== 'in_print' ||
    this.classYearFilter() !== new Date().getFullYear().toString() ||
    this.studioFilter() !== null ||
    this.searchQuery() !== '' ||
    this.projectIdFilter() !== null
  );

  /** WebSocket csatorna neve (ha aktív) */
  private wsChannelName: string | null = null;

  constructor() {
    // WebSocket listener: új üzenet → badge frissítés
    effect(() => {
      const userId = this.authService.currentUserSignal()?.id;
      if (userId) {
        this.setupMessageListener(userId);
      }
    });

    // URL query params → filter state (snapshot az első betöltéshez)
    this.applyQueryParams(this.route.snapshot.queryParams);

    // Query param változás figyelése (ha már az oldalon vagyunk és értesítésre kattintunk)
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(params => {
      if (params['project_id']) {
        this.projectIdFilter.set(Number(params['project_id']));
        this.statusFilter.set('');
        this.classYearFilter.set('');
        this.currentPage.set(1);
        this.loadProjects();
      }
    });

    // Search debounce
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.updateUrl();
      this.loadProjects();
    });

    // Load studios + projects
    this.loadStudios();
    this.loadProjects();

    // Fallback polling: 30s-ként csendben frissíti a listát (ha WS nem él)
    interval(30_000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadProjects(true));
  }

  private applyQueryParams(params: Record<string, string>): void {
    // Ha nincs URL query param, próbáljuk a sessionStorage-ból
    const hasUrlParams = Object.keys(params).some(k => k !== 'project_id' && params[k]);
    if (!hasUrlParams) {
      try {
        const saved = sessionStorage.getItem('printShopFilters');
        if (saved) {
          const restored = JSON.parse(saved) as Record<string, string | null>;
          params = { ...params };
          for (const [key, val] of Object.entries(restored)) {
            if (val && !params[key]) params[key] = val;
          }
        }
      } catch { /* ignore */ }
    }

    if (params['status'] === 'in_print' || params['status'] === 'done' || params['status'] === '') {
      this.statusFilter.set(params['status'] || '');
    }
    if (params['class_year']) {
      this.classYearFilter.set(params['class_year']);
    }
    if (params['search']) {
      this.searchQuery.set(params['search']);
    }
    if (params['studio_id']) {
      this.studioFilter.set(Number(params['studio_id']));
    }
    if (params['page']) {
      this.currentPage.set(Number(params['page']));
    }
    if (params['project_id']) {
      this.projectIdFilter.set(Number(params['project_id']));
      this.statusFilter.set('');
      this.classYearFilter.set('');
    }
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status as '' | 'in_print' | 'done');
    this.currentPage.set(1);
    this.updateUrl();
    this.loadProjects();
  }

  onStudioChange(studioId: string): void {
    this.studioFilter.set(studioId ? Number(studioId) : null);
    this.currentPage.set(1);
    this.updateUrl();
    this.loadProjects();
  }

  onClassYearChange(year: string): void {
    this.classYearFilter.set(year);
    this.currentPage.set(1);
    this.updateUrl();
    this.loadProjects();
  }

  clearFilters(): void {
    this.statusFilter.set('in_print');
    this.classYearFilter.set(new Date().getFullYear().toString());
    this.studioFilter.set(null);
    this.searchQuery.set('');
    this.projectIdFilter.set(null);
    this.currentPage.set(1);
    this.updateUrl();
    this.loadProjects();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.updateUrl();
    this.loadProjects();
  }

  requestMarkDone(project: PrintShopProject): void {
    this.confirmProject.set(project);
    this.confirmAction.set('mark_done');
    this.showConfirmDialog.set(true);
  }

  requestRevert(project: PrintShopProject): void {
    this.confirmProject.set(project);
    this.confirmAction.set('revert');
    this.showConfirmDialog.set(true);
  }

  onConfirmResult(result: ConfirmDialogResult): void {
    this.showConfirmDialog.set(false);
    if (result.action !== 'confirm') return;

    const project = this.confirmProject();
    if (!project) return;

    if (this.confirmAction() === 'mark_done') {
      this.executeMarkDone(project);
    } else {
      this.executeRevert(project);
    }
  }

  private executeMarkDone(project: PrintShopProject): void {
    this.markingDone.set(project.id);

    this.service.markAsDone(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.projects.update(list =>
            list.map(p => p.id === project.id
              ? { ...p, status: 'done' as const, doneAt: new Date().toISOString() }
              : p
            )
          );
          this.markingDone.set(null);
        },
        error: () => {
          this.markingDone.set(null);
        }
      });
  }

  private executeRevert(project: PrintShopProject): void {
    this.reverting.set(project.id);

    this.service.revertToPrint(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.projects.update(list =>
            list.map(p => p.id === project.id
              ? { ...p, status: 'in_print' as const, doneAt: null }
              : p
            )
          );
          this.reverting.set(null);
        },
        error: () => {
          this.reverting.set(null);
        }
      });
  }

  openLightbox(project: PrintShopProject): void {
    const url = project.previewUrl || project.thumbnailUrl;
    if (!url) return;
    this.lightboxSamples.set([{
      id: project.id,
      url,
      thumbUrl: project.thumbnailUrl ?? undefined,
      fileName: project.name,
      createdAt: project.inPrintAt ?? new Date().toISOString(),
    }]);
    this.lightboxIndex.set(0);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  // === Kijelölés ===

  toggleSelect(project: PrintShopProject, event: MouseEvent): void {
    const projects = this.projects();
    const clickedIndex = projects.findIndex(p => p.id === project.id);

    if (event.shiftKey && this.lastClickedIndex() !== null) {
      // Shift+klikk: tartomány kijelölés
      const start = Math.min(this.lastClickedIndex()!, clickedIndex);
      const end = Math.max(this.lastClickedIndex()!, clickedIndex);
      const newSet = new Set(this.selectedIds());
      for (let i = start; i <= end; i++) {
        if (projects[i].hasPrintFile) {
          newSet.add(projects[i].id);
        }
      }
      this.selectedIds.set(newSet);
    } else {
      // Sima klikk: toggle
      const newSet = new Set(this.selectedIds());
      if (newSet.has(project.id)) {
        newSet.delete(project.id);
      } else {
        newSet.add(project.id);
      }
      this.selectedIds.set(newSet);
    }
    this.lastClickedIndex.set(clickedIndex);
  }

  toggleSelectAll(): void {
    const downloadable = this.projects().filter(p => p.hasPrintFile);
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(downloadable.map(p => p.id)));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.lastClickedIndex.set(null);
  }

  batchDownload(): void {
    const ids = this.selectedDownloadable().map(p => p.id);
    if (ids.length === 0) return;

    this.batchDownloading.set(true);
    this.service.batchDownload(ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ blob, fileName }) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          this.batchDownloading.set(false);

          // Letöltés időpont frissítése lokálisan
          const now = new Date().toISOString();
          const downloadedIds = new Set(ids);
          this.projects.update(list =>
            list.map(p => downloadedIds.has(p.id)
              ? { ...p, printShopDownloadedAt: now, printShopDownloadCount: p.printShopDownloadCount + 1 }
              : p
            )
          );
          this.clearSelection();
        },
        error: () => {
          this.batchDownloading.set(false);
        }
      });
  }

  downloadFile(project: PrintShopProject): void {
    const type = project.printFileType === 'print_flat' ? 'flat' : 'small_tablo';
    this.triggerDownload(project.id, type);
  }

  downloadSample(project: PrintShopProject): void {
    this.triggerDownload(project.id, 'sample');
  }

  private triggerDownload(projectId: number, type: string): void {
    this.service.downloadFile(projectId, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ blob, fileName }) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);

          // Letöltés időpont frissítése lokálisan
          if (type !== 'sample') {
            this.projects.update(list =>
              list.map(p => p.id === projectId
                ? { ...p, printShopDownloadedAt: new Date().toISOString(), printShopDownloadCount: p.printShopDownloadCount + 1 }
                : p
              )
            );
          }
        },
        error: () => {}
      });
  }

  formatDate(isoDate: string | null): string {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private setupMessageListener(userId: number): void {
    const ch = `App.Models.User.${userId}`;
    if (this.wsChannelName === ch) return;
    this.wsChannelName = ch;
    const channel = this.wsService.private(ch);
    if (!channel) return;
    const update = (id: number, patch: Partial<PrintShopProject>) =>
      this.projects.update(l => l.map(p => p.id === id ? { ...p, ...patch } : p));
    channel.listen('.print.message.created', (d: { projectId: number }) =>
      update(d.projectId, { unreadMessagesCount: (this.projects().find(p => p.id === d.projectId)?.unreadMessagesCount ?? 0) + 1, totalMessagesCount: (this.projects().find(p => p.id === d.projectId)?.totalMessagesCount ?? 0) + 1 }));
    channel.listen('.print.order.updated', (d: { projectId: number; isUrgent: boolean; isReprint: boolean; reprintCount: number }) =>
      update(d.projectId, { isUrgent: d.isUrgent, isReprint: d.isReprint, reprintCount: d.reprintCount }));
  }

  private loadStudios(): void {
    this.service.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.studios.set(data.connected_studios));
  }

  private loadProjects(silent = false): void {
    if (!silent) {
      this.loading.set(true);
      this.clearSelection();
    }

    this.service.getProjects({
      page: this.currentPage(),
      per_page: this.perPage(),
      status: this.statusFilter() || null,
      search: this.searchQuery() || undefined,
      studio_id: this.studioFilter(),
      class_year: this.classYearFilter() || undefined,
      project_id: this.projectIdFilter(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: PaginatedResponse<PrintShopProject>) => {
          this.projects.set(res.data);
          this.totalCount.set(res.total);
          this.currentPage.set(res.current_page);
          this.lastPage.set(res.last_page);
          if (!silent) this.loading.set(false);
        },
        error: () => {
          if (!silent) this.loading.set(false);
        }
      });
  }

  private updateUrl(): void {
    const queryParams: Record<string, string | null> = {};
    queryParams['status'] = this.statusFilter() || null;
    queryParams['class_year'] = this.classYearFilter() || null;
    queryParams['search'] = this.searchQuery() || null;
    queryParams['studio_id'] = this.studioFilter() ? String(this.studioFilter()) : null;
    queryParams['page'] = this.currentPage() > 1 ? String(this.currentPage()) : null;
    this.router.navigate([], { queryParams, replaceUrl: true });

    // sessionStorage-ba is mentjük a szűrőket (visszanavigáláshoz)
    sessionStorage.setItem('printShopFilters', JSON.stringify(queryParams));
  }

  private getRecentYears(): string[] {
    const y = new Date().getFullYear();
    return [y.toString(), (y - 1).toString(), (y - 2).toString()];
  }
}
