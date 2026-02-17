import { Component, ChangeDetectionStrategy, input, OnInit, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { PsInputComponent, PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { TableHeaderComponent, TableColumn } from '../../../../../../shared/components/table-header';
import { PhotoThumbListComponent, ThumbPhoto } from '../../../../../../shared/components/photo-thumb-list';
import { ExpandDetailPanelComponent, DetailGroupComponent } from '../../../../../../shared/components/expand-detail-panel';
import { MonitoringFilter, SelectionPhoto } from '../../../../models/gallery-monitoring.models';
import { GalleryMonitoringState } from './gallery-monitoring.state';
import { GalleryMonitoringActionsService } from './gallery-monitoring-actions.service';
import { DownloadOptions } from '../download-dialog/download-dialog.component';

@Component({
  selector: 'app-gallery-monitoring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, LucideAngularModule, MatTooltipModule, PsInputComponent, PsSelectComponent, TableHeaderComponent, PhotoThumbListComponent, ExpandDetailPanelComponent, DetailGroupComponent],
  providers: [GalleryMonitoringActionsService],
  templateUrl: './gallery-monitoring.component.html',
  styleUrl: './gallery-monitoring.component.scss',
})
export class GalleryMonitoringComponent implements OnInit {
  projectId = input.required<number>();
  galleryName = input<string>('');

  private readonly actions = inject(GalleryMonitoringActionsService);

  readonly ICONS = ICONS;
  readonly state = new GalleryMonitoringState();

  readonly tableCols: TableColumn[] = [
    { key: 'name', label: 'Név', width: '2fr' },
    { key: 'type', label: 'Típus', width: '70px', align: 'center' },
    { key: 'status', label: 'Státusz', width: '130px', align: 'center' },
    { key: 'step', label: 'Lépés', width: '90px', align: 'center' },
    { key: 'retouch', label: 'Retusálás', width: '80px', align: 'center' },
    { key: 'activity', label: 'Utolsó aktivitás', width: '120px', align: 'center' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly filterOptions: PsSelectOption[] = [
    { id: 'all', label: 'Mindenki' },
    { id: 'finalized', label: 'Véglegesített' },
    { id: 'in_progress', label: 'Folyamatban' },
    { id: 'not_started', label: 'Nem kezdte el' },
    { id: 'stale', label: 'Figyelmeztetés' },
  ];

  /** Dialog defaults - computed-ként cast-olva a megfelelő típusra */
  readonly dialogDefaults = computed<Partial<DownloadOptions>>(() => {
    const s = this.state.exportSettings();
    return {
      zipContent: s.zip_content as DownloadOptions['zipContent'],
      fileNaming: s.file_naming as DownloadOptions['fileNaming'],
    };
  });

  ngOnInit(): void {
    this.actions.loadMonitoring(this.state, this.projectId());
  }

  onToggleExpand(person: { personId: number; hasOpened: boolean }): void {
    if (!person.hasOpened) return;
    this.state.toggleExpand(person.personId);
    if (this.state.expandedPersonId() === person.personId) {
      this.actions.loadPersonSelections(this.state, this.projectId(), person.personId);
    }
  }

  onFilterChange(value: string): void {
    this.state.setFilter(value as MonitoringFilter);
  }

  onExportExcel(): void {
    this.actions.exportExcel(this.state, this.projectId(), this.galleryName());
  }

  onOpenDownloadDialog(): void {
    const settings = this.state.exportSettings();
    if (settings.always_ask) {
      this.state.showDownloadDialog.set(true);
    } else {
      // Közvetlen letöltés a mentett beállításokkal
      this.actions.downloadZip(this.state, this.projectId(), this.galleryName(), {
        zipContent: settings.zip_content as DownloadOptions['zipContent'],
        fileNaming: settings.file_naming as DownloadOptions['fileNaming'],
        includeExcel: false,
      });
    }
  }

  onCloseDownloadDialog(): void {
    this.state.showDownloadDialog.set(false);
  }

  onDownloadZip(options: DownloadOptions): void {
    this.actions.downloadZip(this.state, this.projectId(), this.galleryName(), options);
  }

  onThumbClick(photos: SelectionPhoto[], event: { photo: ThumbPhoto; index: number }): void {
    this.state.openLightbox(photos, event.index);
  }

  onLightboxClose(): void {
    this.state.closeLightbox();
  }

  onLightboxNavigate(index: number): void {
    this.state.navigateLightbox(index);
  }

  getStepLabel(step: string | null): string {
    switch (step) {
      case 'claiming': return 'Kiválasztás';
      case 'retouch': return 'Retusálás';
      case 'tablo': return 'Tablókép';
      case 'completed': return 'Befejezve';
      default: return '-';
    }
  }
}
