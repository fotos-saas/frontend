import { Component, ChangeDetectionStrategy, input, OnInit, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { MonitoringFilter } from '../../../../models/gallery-monitoring.models';
import { GalleryMonitoringState } from './gallery-monitoring.state';
import { GalleryMonitoringActionsService } from './gallery-monitoring-actions.service';

@Component({
  selector: 'app-gallery-monitoring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule],
  providers: [GalleryMonitoringActionsService],
  templateUrl: './gallery-monitoring.component.html',
  styleUrl: './gallery-monitoring.component.scss',
})
export class GalleryMonitoringComponent implements OnInit {
  projectId = input.required<number>();

  private readonly actions = inject(GalleryMonitoringActionsService);

  readonly ICONS = ICONS;
  readonly state = new GalleryMonitoringState();

  ngOnInit(): void {
    this.actions.loadMonitoring(this.state, this.projectId());
  }

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as MonitoringFilter;
    this.state.setFilter(value);
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
