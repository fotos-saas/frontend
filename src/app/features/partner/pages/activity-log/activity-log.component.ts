import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ActivityDetailTabComponent } from './components/activity-detail-tab/activity-detail-tab.component';
import { ActivitySummaryTabComponent } from './components/activity-summary-tab/activity-summary-tab.component';

export type ActivityTab = 'detail' | 'summary';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [LucideAngularModule, ActivityDetailTabComponent, ActivitySummaryTabComponent],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogComponent {
  readonly ICONS = ICONS;
  activeTab = signal<ActivityTab>('detail');
}
