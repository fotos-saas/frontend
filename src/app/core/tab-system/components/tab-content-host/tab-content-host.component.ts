import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { TabManagerService } from '../../services/tab-manager.service';
import { SplitDividerComponent } from '../split-divider/split-divider.component';

@Component({
  selector: 'app-tab-content-host',
  standalone: true,
  imports: [SplitDividerComponent],
  template: `
    <div class="tab-content-host"
         [class.split-horizontal]="tabManager.splitMode() === 'horizontal'"
         [class.split-vertical]="tabManager.splitMode() === 'vertical'"
         [style.--split-ratio]="tabManager.splitRatio()"
         role="tabpanel"
         [attr.aria-labelledby]="'tab-' + tabManager.activeTabId()">

      <!-- Elso panel (mindig lathato) -->
      <div class="panel panel-primary">
        <ng-content></ng-content>
      </div>

      <!-- Split divider (csak split modban) -->
      @if (tabManager.splitMode() !== 'none') {
        <app-split-divider
          [mode]="tabManager.splitMode()"
          [ratio]="tabManager.splitRatio()"
          (ratioChange)="tabManager.setSplitRatio($event)" />
      }

      <!-- Masodik panel (csak split modban) -->
      @if (tabManager.splitMode() !== 'none') {
        <div class="panel panel-secondary">
          <div class="split-placeholder">
            <p class="split-hint">A masodik panel tartalma</p>
            <button class="unsplit-btn" (click)="tabManager.unsplit()">
              Osszevonas
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .tab-content-host {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;

      &.split-horizontal {
        flex-direction: row;

        .panel-primary {
          width: calc(var(--split-ratio, 0.5) * 100%);
        }
        .panel-secondary {
          width: calc((1 - var(--split-ratio, 0.5)) * 100%);
        }
      }

      &.split-vertical {
        flex-direction: column;

        .panel-primary {
          height: calc(var(--split-ratio, 0.5) * 100%);
        }
        .panel-secondary {
          height: calc((1 - var(--split-ratio, 0.5)) * 100%);
        }
      }
    }

    .panel {
      overflow: auto;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .panel-primary {
      flex: 1;
    }

    .panel-secondary {
      background: var(--panel-bg, #fafbfc);

      :host-context(.dark) & {
        --panel-bg: #1e1e20;
      }
    }

    .split-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: var(--text-muted, #9ca3af);
    }

    .split-hint {
      font-size: 14px;
    }

    .unsplit-btn {
      padding: 6px 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
      background: none;
      color: inherit;
      cursor: pointer;
      font-size: 13px;

      &:hover {
        background: rgba(0, 0, 0, 0.04);

        :host-context(.dark) & {
          background: rgba(255, 255, 255, 0.06);
        }
      }

      &:focus-visible {
        outline: 2px solid #7c3aed;
        outline-offset: -1px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabContentHostComponent {
  readonly tabManager = inject(TabManagerService);
}
