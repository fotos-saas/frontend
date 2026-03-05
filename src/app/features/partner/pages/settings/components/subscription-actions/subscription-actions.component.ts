import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { SubscriptionInfo } from '../../../../services/subscription.service';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

/**
 * Subscription Actions Component
 *
 * Előfizetés műveletek: szüneteltetés, lemondás, folytatás.
 */
@Component({
  selector: 'app-subscription-actions',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './subscription-actions.component.html',
  styleUrl: './subscription-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionActionsComponent {
  info = input.required<SubscriptionInfo>();
  isActionLoading = input<boolean>(false);

  onPause = output<void>();
  onUnpause = output<void>();
  onCancel = output<void>();
  onResume = output<void>();

  protected readonly ICONS = ICONS;
}
