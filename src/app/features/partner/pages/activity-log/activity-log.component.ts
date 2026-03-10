import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly ICONS = ICONS;

  activeTab = signal<ActivityTab>(
    this.route.snapshot.queryParamMap.get('tab') === 'summary' ? 'summary' : 'detail',
  );

  setTab(tab: ActivityTab): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tab === 'detail' ? {} : { tab },
      queryParamsHandling: 'replace',
      replaceUrl: false,
    });
  }
}
