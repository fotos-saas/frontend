import { Component, ChangeDetectionStrategy, input, OnInit, inject, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { MonitoringFilter } from '../../../../models/gallery-monitoring.models';
import { GalleryMonitoringState } from './gallery-monitoring.state';
import { GalleryMonitoringActionsService } from './gallery-monitoring-actions.service';
import { DownloadDialogComponent, DownloadOptions } from '../download-dialog/download-dialog.component';

@Component({
  selector: 'app-gallery-monitoring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule, DownloadDialogComponent],
  providers: [GalleryMonitoringActionsService],
  templateUrl: './gallery-monitoring.component.html',
  styleUrl: './gallery-monitoring.component.scss',
})
export class GalleryMonitoringComponent implements OnInit {
  projectId = input.required<number>();

  private readonly actions = inject(GalleryMonitoringActionsService);

  readonly ICONS = ICONS;
  readonly state = new GalleryMonitoringState();

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

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as MonitoringFilter;
    this.state.setFilter(value);
  }

  onExportExcel(): void {
    this.actions.exportExcel(this.state, this.projectId());
  }

  onOpenDownloadDialog(): void {
    const settings = this.state.exportSettings();
    if (settings.always_ask) {
      this.state.showDownloadDialog.set(true);
    } else {
      // Közvetlen letöltés a mentett beállításokkal
      this.actions.downloadZip(this.state, this.projectId(), {
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
    this.actions.downloadZip(this.state, this.projectId(), options);
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

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
