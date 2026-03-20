import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import type { UsageState } from '../../../features/partner/models/time-credit.models';

@Component({
  selector: 'app-usage-meter',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './usage-meter.component.html',
  styleUrl: './usage-meter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageMeterComponent {
  readonly usage = input.required<UsageState>();
  readonly compact = input(false);
  readonly ICONS = ICONS;
  readonly Math = Math;

  readonly fillWidth = computed(() => Math.min(this.usage().percentage, 100));
  readonly overageWidth = computed(() => {
    const pct = this.usage().percentage;
    return pct > 100 ? Math.min(pct - 100, 50) : 0;
  });
}
