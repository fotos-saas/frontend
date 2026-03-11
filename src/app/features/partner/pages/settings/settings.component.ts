import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { SubscriptionCardComponent } from './components/subscription-card/subscription-card.component';
import { SubscriptionActionsComponent } from './components/subscription-actions/subscription-actions.component';
import { DeleteAccountDialogComponent } from './components/delete-account-dialog/delete-account-dialog.component';
import { StorageUsageCardComponent } from './components/storage-usage-card/storage-usage-card.component';
import { StoragePurchaseDialogComponent } from './components/storage-purchase-dialog/storage-purchase-dialog.component';
import { AddonsCardComponent } from './components/addons-card/addons-card.component';
import { SyncSettingsCardComponent } from './components/sync-settings-card/sync-settings-card.component';
import { PrintShopConnectionsCardComponent } from './components/print-shop-connections-card/print-shop-connections-card.component';
import { PrintShopSearchDialogComponent } from './components/print-shop-search-dialog/print-shop-search-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ElectronService } from '../../../../core/services/electron.service';
import { SettingsStateService } from './settings-state.service';
import { PrintShopConnection } from '../../services/print-shop-connection.service';

/**
 * Partner Settings Page
 *
 * Partner beállítások oldal:
 * - Előfizetés kezelés (csomag, státusz, műveletek)
 * - Tárhely kezelés (használat, bővítés)
 * - Fiók törlés (GDPR-kompatibilis soft delete)
 */
@Component({
  selector: 'app-partner-settings',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    SubscriptionCardComponent,
    SubscriptionActionsComponent,
    DeleteAccountDialogComponent,
    StorageUsageCardComponent,
    StoragePurchaseDialogComponent,
    AddonsCardComponent,
    SyncSettingsCardComponent,
    PrintShopConnectionsCardComponent,
    PrintShopSearchDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SettingsStateService]
})
export class PartnerSettingsComponent implements OnInit {
  protected readonly state = inject(SettingsStateService);
  private readonly electronService = inject(ElectronService);
  protected readonly ICONS = ICONS;
  readonly isElectron = this.electronService.isElectron;

  // Signal delegálás a template-nek
  readonly subscriptionInfo = this.state.subscriptionInfo;
  readonly isLoading = this.state.isLoading;
  readonly isActionLoading = this.state.isActionLoading;
  readonly showDeleteDialog = this.state.showDeleteDialog;
  readonly isDeleting = this.state.isDeleting;
  readonly storageUsage = this.state.storageUsage;
  readonly isStorageLoading = this.state.isStorageLoading;
  readonly showStoragePurchaseDialog = this.state.showStoragePurchaseDialog;
  readonly isStorageSubmitting = this.state.isStorageSubmitting;

  // Print shop connection signals
  readonly printShopConnections = this.state.printShopConnections;
  readonly isPrintShopLoading = this.state.isPrintShopLoading;
  readonly printShopActionLoadingId = this.state.printShopActionLoadingId;
  readonly showPrintShopSearchDialog = this.state.showPrintShopSearchDialog;
  readonly showRemoveConfirmDialog = this.state.showRemoveConfirmDialog;
  readonly pendingRemoveConnection = this.state.pendingRemoveConnection;

  ngOnInit(): void {
    this.state.init();
  }

  // === Template-facing metódusok ===
  handleOpenPortal(): void { this.state.openPortal(); }
  handlePause(): void { this.state.pause(); }
  handleUnpause(): void { this.state.unpause(); }
  handleCancel(): void { this.state.cancel(); }
  handleResume(): void { this.state.resume(); }
  openDeleteDialog(): void { this.state.openDeleteDialog(); }
  closeDeleteDialog(): void { this.state.closeDeleteDialog(); }
  handleDeleteAccount(): void { this.state.deleteAccount(); }
  openStoragePurchaseDialog(): void { this.state.openStoragePurchaseDialog(); }
  closeStoragePurchaseDialog(): void { this.state.closeStoragePurchaseDialog(); }
  handleStoragePurchase(gb: number): void { this.state.purchaseStorage(gb); }
  onAddonChanged(): void { this.state.onAddonChanged(); }

  // Print shop connection metódusok
  openPrintShopSearchDialog(): void { this.state.openPrintShopSearchDialog(); }
  closePrintShopSearchDialog(): void { this.state.closePrintShopSearchDialog(); }
  onPrintShopConnectionSent(): void { this.state.onPrintShopConnectionSent(); }
  requestRemovePrintShopConnection(conn: PrintShopConnection): void { this.state.requestRemovePrintShopConnection(conn); }
  onRemoveConfirmResult(result: { action: 'confirm' | 'cancel' }): void { this.state.onRemoveConfirmResult(result); }
}
