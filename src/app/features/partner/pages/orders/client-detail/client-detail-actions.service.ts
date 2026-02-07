import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PartnerOrdersService } from '../../../services/partner-orders.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClientDetailState } from './client-detail.state';

/**
 * ClientDetailActionsService - API hivasok es muveletek a client-detail komponenshez.
 *
 * Nem providedIn: 'root' - komponens szintu scope (state fugg a komponenstol).
 */
@Injectable()
export class ClientDetailActionsService {
  private readonly ordersService = inject(PartnerOrdersService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private destroyRef!: DestroyRef;
  private state!: ClientDetailState;

  init(destroyRef: DestroyRef, state: ClientDetailState): void {
    this.destroyRef = destroyRef;
    this.state = state;
  }

  // === LOADING ===

  loadClient(id: number): void {
    this.state.startLoading();
    this.ordersService.getClient(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (client) => this.state.finishLoading(client),
      error: () => {
        this.toast.error('Hiba', 'Az ugyfel nem talalhato');
        this.router.navigate(['/partner/orders/clients']);
      }
    });
  }

  // === ACCESS CODE ===

  generateCode(): void {
    this.state.generatingCode.set(true);
    this.ordersService.generateCode(this.state.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.codeGenerated(response.data.accessCode, response.data.accessCodeExpiresAt);
        this.toast.success('Siker', 'Belepesi kod generalva!');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.generatingCode.set(false);
      }
    });
  }

  extendExpiry(days: number): void {
    const currentExpiry = this.state.client()?.accessCodeExpiresAt;
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    const startDate = baseDate < new Date() ? new Date() : baseDate;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    this.state.extendingCode.set(true);
    this.ordersService.extendCode(this.state.client()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateCodeExpiry(response.data.accessCodeExpiresAt);
        this.toast.success('Siker', `Lejarat meghosszabbitva ${days} nappal`);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.extendingCode.set(false);
      }
    });
  }

  changeExpiryDate(dateString: string): void {
    const newExpiry = new Date(dateString);
    newExpiry.setHours(23, 59, 59, 999);

    this.state.extendingCode.set(true);
    this.ordersService.extendCode(this.state.client()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateCodeExpiry(response.data.accessCodeExpiresAt);
        this.toast.success('Siker', 'Lejarat modositva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.extendingCode.set(false);
      }
    });
  }

  // === ALBUM ACTIONS ===

  activateAlbum(id: number, photosCount: number): void {
    if (photosCount === 0) {
      this.toast.error('Hiba', 'Tolts fel kepeket az aktivalashoz');
      return;
    }

    this.state.togglingAlbumId.set(id);
    this.ordersService.activateAlbum(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumStatus(id, response.data.status);
        this.toast.success('Siker', 'Album aktivalva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.togglingAlbumId.set(null);
      }
    });
  }

  deactivateAlbum(albumId: number): void {
    this.state.togglingAlbumId.set(albumId);
    this.ordersService.deactivateAlbum(albumId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumStatus(albumId, response.data.status);
        this.toast.success('Siker', 'Album inaktivalva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.togglingAlbumId.set(null);
      }
    });
  }

  toggleDownload(albumId: number): void {
    this.state.togglingDownloadId.set(albumId);
    this.ordersService.toggleAlbumDownload(albumId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumDownload(albumId, response.data.allowDownload);
        this.toast.success('Siker', response.data.allowDownload ? 'Letoltes engedelyezve' : 'Letoltes letiltva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.togglingDownloadId.set(null);
      }
    });
  }

  extendAlbumExpiry(albumId: number, currentExpiresAt: string | null, days: number): void {
    const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt) : new Date();
    const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    this.state.extendingAlbumId.set(albumId);
    this.ordersService.extendAlbumExpiry(albumId, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumExpiry(albumId, response.data.expiresAt);
        this.toast.success('Siker', `Lejarat meghosszabbitva ${days} nappal`);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.extendingAlbumId.set(null);
      }
    });
  }

  // === MODALS ===

  updateClient(): void {
    if (!this.state.editForm.name) return;

    this.state.saving.set(true);
    this.ordersService.updateClient(this.state.client()!.id, {
      name: this.state.editForm.name,
      email: this.state.editForm.email || null,
      phone: this.state.editForm.phone || null,
      note: this.state.editForm.note || null,
      allow_registration: this.state.editForm.allowRegistration
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateClientSuccess({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          note: response.data.note,
          allowRegistration: response.data.allowRegistration
        });
        this.toast.success('Siker', 'Ugyfel frissitve');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.saving.set(false);
      }
    });
  }

  createAlbum(): void {
    if (!this.state.albumForm.name || !this.state.albumForm.type) return;

    this.state.saving.set(true);
    this.ordersService.createAlbum({
      client_id: this.state.client()!.id,
      name: this.state.albumForm.name,
      type: this.state.albumForm.type,
      min_selections: this.state.albumForm.min_selections,
      max_selections: this.state.albumForm.max_selections,
      max_retouch_photos: this.state.albumForm.max_retouch_photos
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album letrehozva');
        this.state.closeAlbumModal();
        this.loadClient(this.state.client()!.id);
        this.state.saving.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        this.state.saving.set(false);
      }
    });
  }

  // === CONFIRM DIALOGS ===

  onDisableCodeResult(result: ConfirmDialogResult): void {
    this.state.disableCodeDialog.close();
    if (result.action === 'confirm') {
      this.ordersService.disableCode(this.state.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.state.codeDisabled();
          this.toast.success('Siker', 'Belepesi kod inaktivalva');
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        }
      });
    }
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    this.state.deleteDialog.close();
    if (result.action === 'confirm') {
      this.ordersService.deleteClient(this.state.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast.success('Siker', 'Ugyfel torolve');
          this.router.navigate(['/partner/orders/clients']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
        }
      });
    }
  }

  onReopenResult(result: ConfirmDialogResult): void {
    const album = this.state.albumToReopen();
    this.state.closeReopenConfirm();

    if (result.action === 'confirm' && album) {
      this.state.togglingAlbumId.set(album.id);
      this.ordersService.reopenAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.state.updateAlbumStatus(album.id, response.data.status);
          this.toast.success('Siker', 'Album ujranyitva - az ugyfel folytathatja');
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message || 'Hiba tortent');
          this.state.togglingAlbumId.set(null);
        }
      });
    }
  }
}
