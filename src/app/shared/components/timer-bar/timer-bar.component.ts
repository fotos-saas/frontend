import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { TimeCreditService } from '../../../features/partner/services/time-credit.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import type { TimerState } from '../../../features/partner/models/time-credit.models';

@Component({
  selector: 'app-timer-bar',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './timer-bar.component.html',
  styleUrl: './timer-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerBarComponent implements OnInit, OnDestroy {
  private service = inject(TimeCreditService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private localOffsets = new Map<number, number>();

  readonly ICONS = ICONS;
  readonly timers = this.service.timers;
  readonly showStopAll = signal(false);

  ngOnInit(): void {
    this.loadTimers();

    // 1 másodperces tick a local counter-ekhez
    this.tickInterval = setInterval(() => {
      this.timers().forEach((t) => {
        if (t.is_running) {
          const current = this.localOffsets.get(t.id) ?? 0;
          this.localOffsets.set(t.id, current + 1);
        }
      });
    }, 1000);

    // 30 másodperces poll a szerver szinkronhoz
    this.pollInterval = setInterval(() => this.loadTimers(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  getDisplayTime(timer: TimerState): string {
    const offset = this.localOffsets.get(timer.id) ?? 0;
    const total = timer.elapsed_seconds + (timer.is_running ? offset : 0);
    return this.formatSeconds(total);
  }

  pause(timerId: number): void {
    this.service.pauseTimer(timerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadTimers(), error: (e) => this.logger.error('Timer pause hiba', e) });
  }

  resume(timerId: number): void {
    this.localOffsets.set(timerId, 0);
    this.service.resumeTimer(timerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadTimers(), error: (e) => this.logger.error('Timer resume hiba', e) });
  }

  stop(timerId: number): void {
    this.service.stopTimer(timerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Rögzítve', 'Időmérés mentve');
          this.localOffsets.delete(timerId);
          this.loadTimers();
        },
        error: (e) => this.logger.error('Timer stop hiba', e),
      });
  }

  stopAll(): void {
    this.service.stopAllTimers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Kész', `${res.stopped_count} időmérés rögzítve`);
          this.localOffsets.clear();
          this.loadTimers();
        },
        error: (e) => this.logger.error('StopAll hiba', e),
      });
  }

  private loadTimers(): void {
    this.service.loadTimers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (timers) => this.showStopAll.set(timers.length > 1),
        error: (err) => this.logger.error('Timerek betöltési hiba', err),
      });
  }

  private formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
