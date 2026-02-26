import { Component, ChangeDetectionStrategy, inject, computed, signal, output, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerActionsService } from '../../layout-designer-actions.service';

/** Toolbar magassága px-ben */
const TOOLBAR_HEIGHT = 40;
/** Gap a kijelölés és a toolbar között */
const GAP = 8;

/**
 * Floating Toolbar — Elementor-stílusú lebegő eszköztár a kijelölt elemek felett.
 * Igazítás, elosztás és dokumentum középre gombok.
 */
@Component({
  selector: 'app-layout-floating-toolbar',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './layout-floating-toolbar.component.html',
  styleUrl: './layout-floating-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutFloatingToolbarComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly actions = inject(LayoutDesignerActionsService);
  protected readonly ICONS = ICONS;

  readonly linking = input<boolean>(false);

  readonly uploadPhotoClicked = output<void>();
  readonly linkLayersClicked = output<void>();
  readonly unlinkLayersClicked = output<void>();

  readonly moreOpen = signal(false);

  /** Toolbar pozíció (canvas wrapper-hez relatív) */
  readonly position = computed(() => {
    const bounds = this.state.selectionScreenBounds();
    if (!bounds) return null;

    // Fent jelenik meg, ha van hely
    const toolbarY = bounds.top - GAP - TOOLBAR_HEIGHT;
    const below = toolbarY < 0;

    return {
      x: bounds.centerX,
      y: below ? bounds.bottom + GAP : toolbarY,
      below,
    };
  });
}
