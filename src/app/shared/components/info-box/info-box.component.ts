import { Component, ChangeDetectionStrategy, input, signal, computed, viewChild, ElementRef, effect, DestroyRef, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../constants/icons.constants';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';

export type InfoBoxTheme = 'blue' | 'green' | 'amber' | 'red';
export type InfoBoxMode = 'inline' | 'dialog';

@Component({
  selector: 'app-info-box',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-box.component.html',
  styleUrl: './info-box.component.scss',
  host: {
    '[style.display]': 'hostDisplay()',
  },
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

  /** Megjelenítési mód: inline (kis banner) vagy dialog (? gomb + felugró) */
  mode = input<InfoBoxMode>('inline');

  readonly ICONS = ICONS;

  visible = signal(true);
  dialogOpen = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogContainer = viewChild<ElementRef<HTMLElement>>('dialogContainer');

  private fullKey = computed(() => `info-box-${this.storageKey()}`);

  hostDisplay = computed(() => {
    if (this.mode() === 'dialog') return 'contents';
    return this.visible() ? 'block' : 'contents';
  });

  constructor() {
    // Dialog container portolása a body-ba amikor megnyílik
    effect(() => {
      const container = this.dialogContainer()?.nativeElement;
      if (!container) return;

      if (this.dialogOpen()) {
        document.body.appendChild(container);
      }
    });

    this.destroyRef.onDestroy(() => {
      // Cleanup: ha a komponens megsemmisül, visszarakjuk a container-t
      const container = this.dialogContainer()?.nativeElement;
      if (container?.parentElement === document.body) {
        container.remove();
      }
    });
  }

  ngOnInit(): void {
    if (this.mode() === 'inline') {
      this.visible.set(!localStorage.getItem(this.fullKey()));
    }
  }

  dismiss(): void {
    localStorage.setItem(this.fullKey(), '1');
    this.visible.set(false);
  }

  restore(): void {
    localStorage.removeItem(this.fullKey());
    this.visible.set(true);
  }

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
  }
}
