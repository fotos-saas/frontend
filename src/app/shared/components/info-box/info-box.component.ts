import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../constants/icons.constants';

export type InfoBoxTheme = 'blue' | 'green' | 'amber' | 'red';

@Component({
  selector: 'app-info-box',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-box.component.html',
  styleUrl: './info-box.component.scss',
})
export class InfoBoxComponent {
  /** Egyedi kulcs a localStorage-ban az eltüntetés megjegyzéséhez */
  storageKey = input.required<string>();

  /** Cím a banner tetején */
  title = input.required<string>();

  /** Szín téma */
  theme = input<InfoBoxTheme>('blue');

  /** Ikon neve (lucide) - alapértelmezett: info */
  icon = input<string>(ICONS.INFO);

  readonly ICONS = ICONS;

  visible = signal(true);

  private fullKey = computed(() => `info-box-${this.storageKey()}`);

  constructor() {
    // Késleltetett init nem kell, a signal default true, majd ngOnInit-ben olvassuk
  }

  ngOnInit(): void {
    this.visible.set(!localStorage.getItem(this.fullKey()));
  }

  dismiss(): void {
    localStorage.setItem(this.fullKey(), '1');
    this.visible.set(false);
  }

  restore(): void {
    localStorage.removeItem(this.fullKey());
    this.visible.set(true);
  }
}
