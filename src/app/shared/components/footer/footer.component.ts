import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService, TabloProject } from '../../../core/services/auth.service';

/**
 * Global Footer Component
 * Displays last activity timestamp (last email date)
 */
@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AsyncPipe]
})
export class FooterComponent {
  project$: Observable<TabloProject | null>;
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService) {
    this.project$ = this.authService.project$;
  }

  /**
   * Format relative time (X napja / X órája)
   */
  getRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return 'Nincs aktivitás';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Most' : `${diffMins} perce`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 órája' : `${diffHours} órája`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? '1 napja' : `${diffDays} napja`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return diffMonths === 1 ? '1 hónapja' : `${diffMonths} hónapja`;
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
