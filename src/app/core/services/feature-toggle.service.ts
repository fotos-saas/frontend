import { Injectable, signal } from '@angular/core';

/**
 * Feature Toggle Service
 *
 * Partner-szintű feature denylist kezelés.
 * A backend disabled_features tömbjét tárolja és ellenőrzi.
 * Prefix egyezés: "sidebar.booking" letiltja "sidebar.booking.calendar"-t is,
 * de "sidebar.booking.calendar" NEM tiltja "sidebar.booking"-ot.
 */
@Injectable({ providedIn: 'root' })
export class FeatureToggleService {
  private readonly disabledFeatures = signal<string[]>([]);

  setDisabledFeatures(features: string[]): void {
    this.disabledFeatures.set(features);
  }

  isDisabled(key: string): boolean {
    return this.disabledFeatures().some(
      rule => key === rule || key.startsWith(rule + '.')
    );
  }

  isEnabled(key: string): boolean {
    return !this.isDisabled(key);
  }
}
