import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PartnerGalleryService } from '../../../../services/partner-gallery.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { GalleryMonitoringState } from './gallery-monitoring.state';

/**
 * GalleryMonitoringActionsService
 *
 * HTTP-hívás logika a monitoring tabhoz.
 * Component-scoped (providers tömbben regisztrált).
 */
@Injectable()
export class GalleryMonitoringActionsService {
  private readonly galleryService = inject(PartnerGalleryService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  loadMonitoring(state: GalleryMonitoringState, projectId: number): void {
    state.setLoading();

    this.galleryService.getMonitoring(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          state.setData(response.persons, response.summary);
        },
        error: () => {
          state.setError();
          this.toast.error('Hiba', 'A monitoring adatok nem tölthetők be');
        },
      });
  }
}
