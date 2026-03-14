import { Component, ChangeDetectionStrategy, inject, computed, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayLayerManagementService } from '../../overlay-layer-management.service';

@Component({
  selector: 'app-overlay-rename-panel',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rename-panel">
      <div class="rename-panel__header">
        <lucide-icon [name]="ICONS.REPLACE" [size]="14" />
        <span>Layer ID frissítés</span>
        <button class="rename-panel__close" (click)="closePanel.emit()" type="button">
          <lucide-icon [name]="ICONS.X" [size]="14" />
        </button>
      </div>

      <div class="rename-panel__body">
        <!-- Matched (automatikusan párosított) -->
        @if (layerMgmt.renameMatched().length > 0) {
          <div class="rename-panel__section">
            <span class="rename-panel__section-label rename-panel__section-label--ok">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="12" />
              Párosított ({{ layerMgmt.renameMatched().length }})
            </span>
            @for (m of layerMgmt.renameMatched(); track m.old) {
              <div class="rename-panel__row rename-panel__row--ok">
                <span class="rename-panel__name">{{ m.personName }}</span>
                <span class="rename-panel__arrow">&#8594;</span>
                <span class="rename-panel__id">{{ m.new }}</span>
              </div>
            }
          </div>
        }

        <!-- Unmatched (kézzel megadható) -->
        @if (layerMgmt.renameUnmatched().length > 0) {
          <div class="rename-panel__section">
            <span class="rename-panel__section-label rename-panel__section-label--warn">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="12" />
              Nem találva ({{ layerMgmt.renameUnmatched().length }})
            </span>
            @for (u of layerMgmt.renameUnmatched(); track u.layerName; let i = $index) {
              <div class="rename-panel__row rename-panel__row--warn">
                <span class="rename-panel__layer-name">{{ u.layerName }}</span>
                <input
                  class="rename-panel__input"
                  type="text"
                  placeholder="Új ID"
                  [value]="u.newId"
                  (input)="layerMgmt.updateUnmatchedId(i, $any($event.target).value)"
                />
              </div>
            }
          </div>
        }
      </div>

      <div class="rename-panel__footer">
        <button
          class="rename-panel__btn rename-panel__btn--cancel"
          (click)="closePanel.emit()"
          type="button"
        >
          Mégse
        </button>
        <button
          class="rename-panel__btn rename-panel__btn--submit"
          [disabled]="!renameCanApply()"
          (click)="layerMgmt.applyRename()"
          type="button"
        >
          @if (layerMgmt.renameApplying()) {
            <span class="toolbar__spinner toolbar__spinner--sm"></span>
            Alkalmazás...
          } @else {
            <lucide-icon [name]="ICONS.CHECK" [size]="14" />
            Alkalmazás
          }
        </button>
      </div>
    </div>
  `,
})
export class OverlayRenamePanelComponent {
  protected readonly ICONS = ICONS;
  readonly layerMgmt = inject(OverlayLayerManagementService);

  readonly closePanel = output<void>();

  readonly renameCanApply = computed(() => {
    if (this.layerMgmt.renameApplying()) return false;
    if (this.layerMgmt.renameMatched().length > 0) return true;
    return this.layerMgmt.renameUnmatched().some(u => u.newId.trim().length > 0);
  });
}
