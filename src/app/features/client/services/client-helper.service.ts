import { Injectable } from '@angular/core';
import { getAlbumStatusLabel } from '../../../shared/constants';

/**
 * Client Helper Service
 *
 * Helper metódusok UI-hez:
 * - Status label (magyar)
 * - Status color class
 * - Type label (magyar)
 */
@Injectable({
  providedIn: 'root'
})
export class ClientHelperService {
  /**
   * Get status label in Hungarian (központi konstansból, client nézet)
   */
  getStatusLabel(status: string): string {
    return getAlbumStatusLabel(status, true);
  }

  /**
   * Get status color class
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      claiming: 'bg-blue-100 text-blue-800',
      retouch: 'bg-yellow-100 text-yellow-800',
      tablo: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
  }

  /**
   * Get type label in Hungarian
   */
  getTypeLabel(type: string): string {
    return type === 'selection' ? 'Képválasztás' : 'Tablókép';
  }
}
