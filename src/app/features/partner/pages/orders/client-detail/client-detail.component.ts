import { Component, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { PartnerOrdersService } from '../../../services/partner-orders.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';
import { ClientDetailState } from './client-detail.state';
import { ClientHeaderComponent } from './components/client-header.component';
import { ClientAccessCodeComponent } from './components/client-access-code.component';
import { ClientAlbumListComponent } from './components/client-album-list.component';

/**
 * Partner Client Detail Component
 *
 * Ügyfél részleteinek megjelenítése és kezelése.
 * Refaktorálva: 1745 sor → ~250 sor + child komponensek + state class
 *
 * Struktúra:
 * - ClientDetailState: Összes állapot kezelése
 * - ClientHeaderComponent: Fejléc (vissza, akciók, meta)
 * - ClientAccessCodeComponent: Belépési kód kezelése
 * - ClientAlbumListComponent: Album lista + kártyák
 */
@Component({
  selector: 'app-partner-client-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ConfirmDialogComponent,
    ClientHeaderComponent,
    ClientAccessCodeComponent,
    ClientAlbumListComponent
  ],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss'
})
export class PartnerClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private ordersService = inject(PartnerOrdersService);
  private toast = inject(ToastService);

  readonly ICONS = ICONS;
  readonly state = new ClientDetailState();

  // Backdrop handlers for modals
  readonly editBackdropHandler = createBackdropHandler(() => this.state.closeEditModal());
  readonly albumBackdropHandler = createBackdropHandler(() => this.state.closeAlbumModal());

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    if (!id || isNaN(id) || id < 1) {
      this.router.navigate(['/partner/orders/clients']);
      return;
    }
    this.loadClient(id);
  }

  private loadClient(id: number): void {
    this.state.startLoading();
    this.ordersService.getClient(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (client) => this.state.finishLoading(client),
      error: () => {
        this.toast.error('Hiba', 'Az ügyfél nem található');
        this.router.navigate(['/partner/orders/clients']);
      }
    });
  }

  // === HEADER EVENTS ===

  onEdit(): void {
    this.state.openEditModal();
  }

  onDelete(): void {
    this.state.deleteDialog.open();
  }

  onDisableCode(): void {
    this.state.disableCodeDialog.open();
  }

  // === ACCESS CODE EVENTS ===

  onCopyCode(): void {
    const code = this.state.client()?.accessCode;
    if (code) {
      navigator.clipboard.writeText(code);
      this.toast.success('Siker', 'Kód másolva!');
    }
  }

  onGenerateCode(): void {
    this.state.generatingCode.set(true);
    this.ordersService.generateCode(this.state.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.codeGenerated(response.data.accessCode, response.data.accessCodeExpiresAt);
        this.toast.success('Siker', 'Belépési kód generálva!');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.generatingCode.set(false);
      }
    });
  }

  onExtendExpiry(days: number): void {
    const currentExpiry = this.state.client()?.accessCodeExpiresAt;
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    const startDate = baseDate < new Date() ? new Date() : baseDate;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    this.state.extendingCode.set(true);
    this.ordersService.extendCode(this.state.client()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateCodeExpiry(response.data.accessCodeExpiresAt);
        this.toast.success('Siker', `Lejárat meghosszabbítva ${days} nappal`);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.extendingCode.set(false);
      }
    });
  }

  onExpiryDateChange(dateString: string): void {
    const newExpiry = new Date(dateString);
    newExpiry.setHours(23, 59, 59, 999);

    this.state.extendingCode.set(true);
    this.ordersService.extendCode(this.state.client()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateCodeExpiry(response.data.accessCodeExpiresAt);
        this.toast.success('Siker', 'Lejárat módosítva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.extendingCode.set(false);
      }
    });
  }

  // === ALBUM LIST EVENTS ===

  onCreateAlbum(): void {
    this.state.openAlbumModal();
  }

  onActivateAlbum(event: { id: number; photosCount: number }): void {
    if (event.photosCount === 0) {
      this.toast.error('Hiba', 'Tölts fel képeket az aktiváláshoz');
      return;
    }

    this.state.togglingAlbumId.set(event.id);
    this.ordersService.activateAlbum(event.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumStatus(event.id, response.data.status);
        this.toast.success('Siker', 'Album aktiválva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.togglingAlbumId.set(null);
      }
    });
  }

  onDeactivateAlbum(album: { id: number }): void {
    this.state.togglingAlbumId.set(album.id);
    this.ordersService.deactivateAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumStatus(album.id, response.data.status);
        this.toast.success('Siker', 'Album inaktiválva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.togglingAlbumId.set(null);
      }
    });
  }

  onReopenAlbum(album: { id: number; name: string }): void {
    this.state.confirmReopen(album);
  }

  onToggleDownload(album: { id: number; allowDownload: boolean }): void {
    this.state.togglingDownloadId.set(album.id);
    this.ordersService.toggleAlbumDownload(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumDownload(album.id, response.data.allowDownload);
        this.toast.success('Siker', response.data.allowDownload ? 'Letöltés engedélyezve' : 'Letöltés letiltva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.togglingDownloadId.set(null);
      }
    });
  }

  onExtendAlbumExpiry(event: { album: { id: number; expiresAt: string | null }; days: number }): void {
    const currentExpiry = event.album.expiresAt ? new Date(event.album.expiresAt) : new Date();
    const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + event.days);

    this.state.extendingAlbumId.set(event.album.id);
    this.ordersService.extendAlbumExpiry(event.album.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.state.updateAlbumExpiry(event.album.id, response.data.expiresAt);
        this.toast.success('Siker', `Lejárat meghosszabbítva ${event.days} nappal`);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.extendingAlbumId.set(null);
      }
    });
  }

  // === MODAL ACTIONS ===

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
        this.toast.success('Siker', 'Ügyfél frissítve');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
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
        this.toast.success('Siker', 'Album létrehozva');
        this.state.closeAlbumModal();
        this.loadClient(this.state.client()!.id);
        this.state.saving.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.state.saving.set(false);
      }
    });
  }

  // === CONFIRM DIALOG RESULTS ===

  onDisableCodeResult(result: ConfirmDialogResult): void {
    this.state.disableCodeDialog.close();
    if (result.action === 'confirm') {
      this.ordersService.disableCode(this.state.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.state.codeDisabled();
          this.toast.success('Siker', 'Belépési kód inaktiválva');
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        }
      });
    }
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    this.state.deleteDialog.close();
    if (result.action === 'confirm') {
      this.ordersService.deleteClient(this.state.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast.success('Siker', 'Ügyfél törölve');
          this.router.navigate(['/partner/orders/clients']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message || 'Hiba történt');
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
          this.toast.success('Siker', 'Album újranyitva - az ügyfél folytathatja');
        },
        error: (err: { error?: { message?: string } }) => {
          this.toast.error('Hiba', err.error?.message || 'Hiba történt');
          this.state.togglingAlbumId.set(null);
        }
      });
    }
  }
}
