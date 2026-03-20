import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import type { EmailHubDashboard } from '../../models/email-hub.models';
import { createResourceLoader } from '@shared/utils/resource-loader.util';

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
  private rl = createResourceLoader();

  readonly ICONS = ICONS;
  readonly loading = this.rl.loading;
  readonly dashboard = signal<EmailHubDashboard | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.rl.load(
      this.emailHubService.getDashboard(),
      (data) => this.dashboard.set(data),
      'Email Hub dashboard betöltési hiba',
    );
  }

  navigateTo(path: string): void {
    this.router.navigate(['/partner/email-hub', path]);
  }
}
