import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerOrdersService, PartnerOrderAlbumSummary } from '../../../../../services/partner-orders.service';

/**
 * Client Album List Component
 *
 * Albumok listázása és kezelése:
 * - Album kártyák (navigáció részletekhez)
 * - Státusz váltás (aktiválás/inaktiválás)
 * - Lejárat kezelés
 * - Letöltés engedélyezés toggle
 * - Újranyitás gomb (completed albumoknál)
 */
@Component({
  selector: 'app-client-album-list',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './client-album-list.component.html',
  styleUrls: ['./client-album-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAlbumListComponent {
  protected readonly ICONS = ICONS;
  protected readonly ordersService = inject(PartnerOrdersService);

  /** Albumok listája */
  readonly albums = input.required<PartnerOrderAlbumSummary[]>();

  /** Loading states */
  readonly extendingAlbumId = input<number | null>(null);
  readonly togglingAlbumId = input<number | null>(null);
  readonly togglingDownloadId = input<number | null>(null);

  /** Output events */
  readonly createAlbum = output<void>();
  readonly activateAlbum = output<PartnerOrderAlbumSummary>();
  readonly deactivateAlbum = output<PartnerOrderAlbumSummary>();
  readonly reopenAlbum = output<PartnerOrderAlbumSummary>();
  readonly toggleDownload = output<PartnerOrderAlbumSummary>();
  readonly extendAlbumExpiry = output<{ album: PartnerOrderAlbumSummary; days: number }>();

  isAlbumExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  formatExpiryDate(expiresAt: string | null): string {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
