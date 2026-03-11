import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopProject, PrintShopStudio, PaginatedResponse } from '../../models/print-shop.models';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SamplesLightboxComponent, SampleLightboxItem } from '@shared/components/samples-lightbox';
import { ICONS } from '@shared/constants/icons.constants';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-print-shop-projects',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, MatTooltipModule, ConfirmDialogComponent, SamplesLightboxComponent],
  templateUrl: './print-shop-projects.component.html',
  styleUrls: ['./print-shop-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopProjectsComponent {
  private service = inject(PrintShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

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
  studios = signal<PrintShopStudio[]>([]);
  availableYears = signal<string[]>(this.getRecentYears());

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
    this.searchQuery() !== ''
  );

  constructor() {
    // URL query params → initial filter state
    const params = this.route.snapshot.queryParams;
    if (params['status'] === 'in_print' || params['status'] === 'done' || params['status'] === '') {
      this.statusFilter.set(params['status'] || '');
    }
    if (params['class_year']) {
      this.classYearFilter.set(params['class_year']);
    }

    // Search debounce
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadProjects();
    });

    // Load studios + projects
    this.loadStudios();
    this.loadProjects();
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
    this.currentPage.set(1);
    this.updateUrl();
    this.loadProjects();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
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

  downloadFile(project: PrintShopProject): void {
    const type = project.printFileType === 'print_flat' ? 'flat' : 'small_tablo';
    const url = this.service.getDownloadUrl(project.id, type);
    window.open(url, '_blank');
  }

  downloadSample(project: PrintShopProject): void {
    const url = this.service.getDownloadUrl(project.id, 'sample');
    window.open(url, '_blank');
  }

  formatDate(isoDate: string | null): string {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    return status === 'in_print' ? 'Nyomdában' : 'Kész';
  }

  private loadStudios(): void {
    this.service.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.studios.set(data.connected_studios));
  }

  private loadProjects(): void {
    this.loading.set(true);

    this.service.getProjects({
      page: this.currentPage(),
      per_page: this.perPage(),
      status: this.statusFilter() || null,
      search: this.searchQuery() || undefined,
      studio_id: this.studioFilter(),
      class_year: this.classYearFilter() || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: PaginatedResponse<PrintShopProject>) => {
          this.projects.set(res.data);
          this.totalCount.set(res.total);
          this.currentPage.set(res.current_page);
          this.lastPage.set(res.last_page);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  private updateUrl(): void {
    const queryParams: Record<string, string | null> = {};
    queryParams['status'] = this.statusFilter() || null;
    queryParams['class_year'] = this.classYearFilter() || null;
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }

  private getRecentYears(): string[] {
    const currentYear = new Date().getFullYear();
    return [
      currentYear.toString(),
      (currentYear - 1).toString(),
      (currentYear - 2).toString(),
    ];
  }
}
