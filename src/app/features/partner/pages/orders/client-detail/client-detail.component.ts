import { Component, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent, PsTextareaComponent, PsCheckboxComponent } from '@shared/components/form';
import { ToastService } from '../../../../../core/services/toast.service';
import { ClipboardService } from '../../../../../core/services/clipboard.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClientDetailState } from './client-detail.state';
import { ClientDetailActionsService } from './client-detail-actions.service';
import { ClientHeaderComponent } from './components/client-header/client-header.component';
import { ClientAccessCodeComponent } from './components/client-access-code/client-access-code.component';
import { ClientAlbumListComponent } from './components/client-album-list/client-album-list.component';

/**
 * Partner Client Detail Component
 *
 * Ugyfel reszleteinek megjelenitese es kezelese.
 * Az API hivasok a ClientDetailActionsService-ben vannak.
 */
@Component({
  selector: 'app-partner-client-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    DialogWrapperComponent,
    PsInputComponent,
    PsTextareaComponent,
    PsCheckboxComponent,
    ConfirmDialogComponent,
    ClientHeaderComponent,
    ClientAccessCodeComponent,
    ClientAlbumListComponent,
  ],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
  providers: [ClientDetailActionsService],
})
export class PartnerClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly actions = inject(ClientDetailActionsService);

  readonly ICONS = ICONS;
  readonly state = new ClientDetailState();

  ngOnInit(): void {
    this.actions.init(this.destroyRef, this.state);

    const id = +this.route.snapshot.params['id'];
    if (!id || isNaN(id) || id < 1) {
      this.router.navigate(['/partner/orders/clients']);
      return;
    }
    this.actions.loadClient(id);
  }

  // === HEADER EVENTS ===

  onEdit(): void { this.state.openEditModal(); }
  onDelete(): void { this.state.deleteDialog.open(); }
  onDisableCode(): void { this.state.disableCodeDialog.open(); }

  // === ACCESS CODE EVENTS ===

  onCopyCode(): void {
    const code = this.state.client()?.accessCode;
    if (code) {
      this.clipboardService.copy(code, 'Hozzáférési kód');
    }
  }

  onGenerateCode(): void { this.actions.generateCode(); }
  onExtendExpiry(days: number): void { this.actions.extendExpiry(days); }
  onExpiryDateChange(dateString: string): void { this.actions.changeExpiryDate(dateString); }

  // === ALBUM LIST EVENTS ===

  onCreateAlbum(): void { this.state.openAlbumModal(); }

  onActivateAlbum(event: { id: number; photosCount: number }): void {
    this.actions.activateAlbum(event.id, event.photosCount);
  }

  onDeactivateAlbum(album: { id: number }): void { this.actions.deactivateAlbum(album.id); }
  onReopenAlbum(album: { id: number; name: string }): void { this.state.confirmReopen(album); }
  onToggleDownload(album: { id: number; allowDownload: boolean }): void { this.actions.toggleDownload(album.id); }

  onExtendAlbumExpiry(event: { album: { id: number; expiresAt: string | null }; days: number }): void {
    this.actions.extendAlbumExpiry(event.album.id, event.album.expiresAt, event.days);
  }

  // === MODAL ACTIONS ===

  updateClient(): void { this.actions.updateClient(); }
  createAlbum(): void { this.actions.createAlbum(); }

  // === CONFIRM DIALOG RESULTS ===

  onDisableCodeResult(result: ConfirmDialogResult): void { this.actions.onDisableCodeResult(result); }
  onDeleteResult(result: ConfirmDialogResult): void { this.actions.onDeleteResult(result); }
  onReopenResult(result: ConfirmDialogResult): void { this.actions.onReopenResult(result); }
}
