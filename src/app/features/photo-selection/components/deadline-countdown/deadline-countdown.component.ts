import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';

type UrgencyLevel = 'calm' | 'soon' | 'urgent' | 'critical' | 'expired';

@Component({
  selector: 'app-deadline-countdown',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './deadline-countdown.component.html',
  styleUrl: './deadline-countdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeadlineCountdownComponent implements OnInit, OnDestroy {
  readonly ICONS = ICONS;

  readonly deadline = input.required<string>();
  readonly daysRemaining = input.required<number>();
  readonly isExpired = input<boolean>(false);
  readonly deadlineFormatted = input<string | null>(null);

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  readonly now = signal<Date>(new Date());

  readonly urgencyLevel = computed<UrgencyLevel>(() => {
    if (this.isExpired()) return 'expired';
    const days = this.daysRemaining();
    if (days <= 1) return 'critical';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'calm';
  });

  readonly countdownText = computed(() => {
    const days = this.daysRemaining();
    if (this.isExpired()) {
      const absDays = Math.abs(days);
      if (absDays === 0) return 'Ma lejart!';
      return `${absDays} napja lejart!`;
    }
    if (days === 0) return 'Ma jar le!';
    if (days === 1) return 'Holnap jar le!';
    return `${days} nap van hatra`;
  });

  readonly urgencyMessage = computed(() => {
    const level = this.urgencyLevel();
    switch (level) {
      case 'expired': return 'A kepvalasztas hatarIdeje lejart!';
      case 'critical': return 'Siess, alig van idod!';
      case 'urgent': return 'Hamarosan lejar a hatarido!';
      case 'soon': return 'Ne felejtsd el idoben befelyezni!';
      case 'calm': return 'Van meg idod, de ne halogazd!';
    }
  });

  readonly timeRemaining = computed(() => {
    if (this.isExpired()) return null;
    const d = this.deadline();
    const deadlineDate = new Date(d + 'T23:59:59');
    const current = this.now();
    const diffMs = deadlineDate.getTime() - current.getTime();
    if (diffMs <= 0) return null;
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  });

  ngOnInit(): void {
    this.tickInterval = setInterval(() => {
      this.now.set(new Date());
    }, 60_000);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }
}
