import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayLayerManagementService } from '../../overlay-layer-management.service';

@Component({
  selector: 'app-overlay-refresh-roster-panel',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rename-panel">
      <div class="rename-panel__header">
        <lucide-icon [name]="ICONS.USERS" [size]="14" />
        <span>Névsor frissítés</span>
        <button class="rename-panel__close" (click)="closePanel.emit()" type="button">
          <lucide-icon [name]="ICONS.X" [size]="14" />
        </button>
      </div>

      <div class="rename-panel__body">
        @if (layerMgmt.refreshRosterToRemove().length > 0) {
          <div class="rename-panel__section">
            <span class="rename-panel__section-label rename-panel__section-label--warn">
              <lucide-icon [name]="ICONS.DELETE" [size]="12" />
              Törlendő ({{ layerMgmt.refreshRosterToRemove().length }})
            </span>
            @for (item of layerMgmt.refreshRosterToRemove(); track item.layerName) {
              <div class="rename-panel__row rename-panel__row--warn">
                <span class="rename-panel__name">{{ item.name }}</span>
              </div>
            }
          </div>
        }

        @if (layerMgmt.refreshRosterToAdd().length > 0) {
          <div class="rename-panel__section">
            <span class="rename-panel__section-label rename-panel__section-label--ok">
              <lucide-icon [name]="ICONS.PLUS" [size]="12" />
              Hozzáadandó ({{ layerMgmt.refreshRosterToAdd().length }})
            </span>
            @for (item of layerMgmt.refreshRosterToAdd(); track item.layerName) {
              <div class="rename-panel__row rename-panel__row--ok">
                <span class="rename-panel__name">{{ item.name }}</span>
                <span class="rename-panel__id">{{ item.type === 'teacher' ? 'Tanár' : 'Diák' }}</span>
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
          [disabled]="layerMgmt.refreshRosterApplying()"
          (click)="layerMgmt.applyRefreshRoster()"
          type="button"
        >
          @if (layerMgmt.refreshRosterApplying()) {
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
export class OverlayRefreshRosterPanelComponent {
  protected readonly ICONS = ICONS;
  readonly layerMgmt = inject(OverlayLayerManagementService);

  readonly closePanel = output<void>();
}
