import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { PrintShopConnection } from '../../../../services/print-shop-connection.service';

/**
 * PrintShopConnectionsCardComponent
 *
 * Nyomda kapcsolatok megjelenítése a beállítások oldalon.
 * - Aktív kapcsolatok listája
 * - Pending kérelmek jelzése
 * - Kapcsolat törlése/visszavonása
 * - Nyomda keresés indítása
 */
@Component({
  selector: 'app-print-shop-connections-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './print-shop-connections-card.component.html',
  styleUrls: ['./print-shop-connections-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopConnectionsCardComponent {
  protected readonly ICONS = ICONS;

  /** Kapcsolatok listája */
  connections = input.required<PrintShopConnection[]>();

  /** Betöltés folyamatban */
  isLoading = input<boolean>(false);

  /** Művelet folyamatban (adott connection ID) */
  actionLoadingId = input<number | null>(null);

  /** Nyomda keresés dialógus megnyitása */
  openSearch = output<void>();

  /** Kapcsolat törlése/visszavonása */
  removeConnection = output<PrintShopConnection>();

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status--active';
      case 'pending': return 'status--pending';
      default: return 'status--inactive';
    }
  }

  getRemoveLabel(connection: PrintShopConnection): string {
    return connection.status === 'pending' ? 'Visszavonás' : 'Leválasztás';
  }

  getRemoveTooltip(connection: PrintShopConnection): string {
    return connection.status === 'pending'
      ? 'Kérelem visszavonása'
      : 'Nyomda kapcsolat megszüntetése';
  }
}
