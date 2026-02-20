import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { PartnerFinalizationService } from '../../services/partner-finalization.service';
import { FinalizationListItem, TabloSize } from '../../models/partner.models';
import { FinalizationCardComponent } from '../../components/finalization-card/finalization-card.component';
import { PrintReadyUploadDialogComponent } from '../../components/print-ready-upload-dialog/print-ready-upload-dialog.component';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { SmartFilterBarComponent, SearchConfig, SortDef, FilterConfig } from '../../../../shared/components/smart-filter-bar';
import { ListPaginationComponent } from '../../../../shared/components/list-pagination/list-pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { useFilterState } from '../../../../shared/utils/use-filter-state';
import { generateYearOptions, getCurrentGraduationYear } from '../../../../shared/utils/year-options.util';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { saveFile } from '../../../../shared/utils/file.util';
import { MediaLightboxComponent } from '../../../../shared/components/media-lightbox/media-lightbox.component';
import { LightboxMediaItem } from '../../../../shared/components/media-lightbox/media-lightbox.types';

@Component({
  selector: 'app-finalization-list',
  standalone: true,
  imports: [
    LucideAngularModule,
    FinalizationCardComponent,
    PrintReadyUploadDialogComponent,
    TableHeaderComponent,
    SmartFilterBarComponent,
    ListPaginationComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
  ],
  templateUrl: './finalization-list.component.html',
  styleUrl: './finalization-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalizationListComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly finalizationService = inject(PartnerFinalizationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;

  readonly tableCols: TableColumn[] = [
    { key: 'sample', label: '', width: '48px' },
    { key: 'school_name', label: 'Iskola / Osztály', sortable: true },
    { key: 'finalized_at', label: 'Véglegesítve', width: '100px', align: 'center', sortable: true },
    { key: 'size', label: 'Méret', width: '100px', align: 'center' },
    { key: 'file', label: 'Fájl', width: '140px', align: 'center' },
    { key: 'actions', label: '', width: '88px' },
  ];
  readonly gridTemplate = this.tableCols.map(c => c.width ?? '1fr').join(' ');

  readonly searchConfig: SearchConfig = {
    placeholder: 'Keresés (#ID, "pontos kifejezés")...',
    features: { id: true, exact: true },
  };

  readonly yearOptions = generateYearOptions();

  readonly filterConfigs: FilterConfig[] = [
    { id: 'graduation_year', label: 'Tanév', icon: 'calendar', options: this.yearOptions },
  ];

  readonly sortDef: SortDef = {
    options: [
      { value: 'finalized_at', label: 'Véglegesítve' },
      { value: 'school_name', label: 'Iskola' },
      { value: 'class_year', label: 'Évfolyam' },
      { value: 'created_at', label: 'Létrehozva' },
    ],
  };

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'finalizations' },
    defaultFilters: { graduation_year: getCurrentGraduationYear().toString() },
    defaultSortBy: 'finalized_at',
    defaultSortDir: 'desc',
    validation: {
      sortByOptions: ['finalized_at', 'school_name', 'class_year', 'created_at'],
    },
    onStateChange: () => this.loadFinalizations(),
  });

  items = signal<FinalizationListItem[]>([]);
  totalPages = signal(1);
  totalItems = signal(0);
  availableTabloSizes = signal<TabloSize[]>([]);

  // Lightbox
  lightboxMedia = signal<LightboxMediaItem[]>([]);
  lightboxOpen = signal(false);

  // Download state
  downloadingId = signal<number | null>(null);

  // Upload dialog
  showUploadDialog = signal(false);
  uploadFileType = signal<'small_tablo' | 'flat'>('small_tablo');
  // Mark done confirm dialog
  showMarkDoneConfirm = signal(false);
  private markDoneItem = signal<FinalizationListItem | null>(null);
  private selectedItemId = signal<number | null>(null);
  readonly selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (!id) return null;
    return this.items().find(i => i.id === id) ?? null;
  });

  ngOnInit(): void {
    this.loadFinalizations();
  }

  loadFinalizations(): void {
    this.filterState.loading.set(true);
    const filters = this.filterState.filters();

    this.finalizationService.getFinalizations({
      page: this.filterState.page(),
      per_page: 15,
      search: this.filterState.search() || undefined,
      sort_by: this.filterState.sortBy() as 'created_at' | 'finalized_at' | 'school_name' | 'class_year',
      sort_dir: this.filterState.sortDir(),
      graduation_year: filters['graduation_year'] ? parseInt(filters['graduation_year'], 10) : undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.items.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalItems.set(response.total);
          if ('available_tablo_sizes' in response) {
            this.availableTabloSizes.set((response as { available_tablo_sizes: TabloSize[] }).available_tablo_sizes);
          }
          this.filterState.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load finalizations', err);
          this.filterState.loading.set(false);
        },
      });
  }

  viewProject(item: FinalizationListItem): void {
    this.router.navigate(['/partner/projects', item.id]);
  }

  openLightbox(item: FinalizationListItem): void {
    if (!item.samplePreviewUrl) return;
    this.lightboxMedia.set([{
      id: item.id,
      url: item.samplePreviewUrl,
      fileName: `${item.schoolName ?? 'Minta'} - ${item.className ?? ''}`.trim(),
    }]);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  openUploadDialog(item: FinalizationListItem): void {
    this.selectedItemId.set(item.id);
    this.showUploadDialog.set(true);
  }

  closeUploadDialog(): void {
    this.showUploadDialog.set(false);
    this.selectedItemId.set(null);
  }

  onFileUploaded(): void {
    this.closeUploadDialog();
    this.loadFinalizations();
    this.toast.success('Feltöltve', 'Nyomdakész fájl sikeresen feltöltve.');
  }

  downloadFile(item: FinalizationListItem): void {
    const file = item.printFlat;
    if (!file || this.downloadingId() === item.id) return;

    this.downloadingId.set(item.id);
    const fileName = file.fileName;
    this.finalizationService.downloadPrintReady(item.id, 'flat')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          saveFile(blob, fileName);
          this.downloadingId.set(null);
        },
        error: (err) => {
          this.logger.error('Failed to download print ready file', err);
          this.toast.error('Hiba', 'Nem sikerült letölteni a fájlt.');
          this.downloadingId.set(null);
        },
      });
  }

  onDialogSizeChange(event: { projectId: number; size: string }): void {
    this.items.update(list =>
      list.map(i =>
        i.id === event.projectId ? { ...i, tabloSize: event.size || null } : i
      )
    );
  }

  onMarkAsDone(item: FinalizationListItem): void {
    this.markDoneItem.set(item);
    this.showMarkDoneConfirm.set(true);
  }

  onMarkDoneConfirmResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'confirm') {
      const item = this.markDoneItem();
      if (item) {
        this.finalizationService.markAsDone(item.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.items.update(list =>
                list.map(i =>
                  i.id === item.id ? { ...i, status: 'done' } : i
                )
              );
              this.toast.success('Kész', 'Projekt készre állítva.');
            },
            error: (err) => {
              this.logger.error('Failed to mark as done', err);
              this.toast.error('Hiba', 'Nem sikerült készre állítani a projektet.');
            },
          });
      }
    }
    this.showMarkDoneConfirm.set(false);
    this.markDoneItem.set(null);
  }

  onTabloSizeChange(event: { item: FinalizationListItem; size: string }): void {
    this.finalizationService.updateTabloSize(event.item.id, event.size || null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.items.update(list =>
            list.map(i =>
              i.id === event.item.id ? { ...i, tabloSize: response.data.tabloSize } : i
            )
          );
        },
        error: (err) => {
          this.logger.error('Failed to update tablo size', err);
          this.toast.error('Hiba', 'Nem sikerült frissíteni a tablóméretet.');
        },
      });
  }
}
