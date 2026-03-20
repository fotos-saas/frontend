import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import type { EmailHubDashboard } from '../../models/email-hub.models';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-email-hub-dashboard',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './email-hub-dashboard.component.html',
  styleUrl: './email-hub-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHubDashboardComponent implements OnInit {
  private emailHubService = inject(EmailHubService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  readonly ICONS = ICONS;
  readonly loading = signal(true);
  readonly dashboard = signal<EmailHubDashboard | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.emailHubService
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Email Hub dashboard betöltési hiba', err);
          this.loading.set(false);
        },
      });
  }

  navigateTo(path: string): void {
    this.router.navigate(['/partner/email-hub', path]);
  }
}
