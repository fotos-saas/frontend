import { Component, ChangeDetectionStrategy, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

/**
 * Keresőmező név alapú szűréshez.
 */
@Component({
  selector: 'app-review-search-box',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="search-section">
      <div class="search-box">
        <lucide-icon [name]="ICONS.SEARCH" class="search-icon" [size]="16" />
        <input
          type="text"
          placeholder="Keresés név alapján..."
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          class="search-input"
        />
        @if (query()) {
          <button class="clear-btn" (click)="query.set('')">
            <lucide-icon [name]="ICONS.X" [size]="14" />
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-section {
      display: flex;
      justify-content: center;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      max-width: 300px;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 8px 36px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: all 0.15s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .clear-btn:hover {
      color: #64748b;
      background: #f1f5f9;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewSearchBoxComponent {
  readonly ICONS = ICONS;

  /** Two-way binding: keresési query */
  readonly query = model.required<string>();
}
