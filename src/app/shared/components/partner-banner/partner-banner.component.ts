import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService, TabloProject } from '../../../core/services/auth.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { Observable } from 'rxjs';

/**
 * Partner Banner Component
 *
 * Megjeleníti a partner elérhetőségeit egy elegáns sávban
 * a header alatt (nem home oldalakon).
 */
@Component({
    selector: 'app-partner-banner',
    templateUrl: './partner-banner.component.html',
    styleUrls: ['./partner-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AsyncPipe]
})
export class PartnerBannerComponent {
  /** Projekt adatok */
  project$: Observable<TabloProject | null>;

  constructor(
    private authService: AuthService,
    private clipboardService: ClipboardService
  ) {
    this.project$ = this.authService.project$;
  }

  /**
   * Email másolása vágólapra
   */
  copyEmail(email: string): void {
    this.clipboardService.copyEmail(email);
  }
}
