import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';

export interface DropdownOption {
  id: number;
  name: string;
  subtitle?: string;
}

/**
 * Kereshető dropdown komponens - újrahasználható iskola és kapcsolattartó választóhoz.
 */
@Component({
  selector: 'app-searchable-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dropdown-wrapper">
      <div class="dropdown-search">
        <lucide-icon [name]="ICONS.SEARCH" [size]="16" class="search-icon" />
        <input
          type="text"
          [placeholder]="placeholder()"
          [ngModel]="searchText()"
          (ngModelChange)="onSearchChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur($event)"
          class="form-input"
          autocomplete="off"
        />
        @if (selectedItem()) {
          <button type="button" class="clear-btn" (click)="clear()">
            <lucide-icon [name]="ICONS.X" [size]="14" />
          </button>
        }
      </div>

      @if (showDropdown() && loading()) {
        <div class="dropdown-list">
          <div class="dropdown-loading">
            <span class="dropdown-spinner"></span>
            Betöltés...
          </div>
        </div>
      } @else if (showDropdown() && options().length > 0) {
        <div class="dropdown-list">
          @for (option of options(); track option.id) {
            <button
              type="button"
              class="dropdown-option"
              [class.dropdown-option--selected]="selectedItem()?.id === option.id"
              (mousedown)="select(option); $event.preventDefault()"
            >
              <span class="option-name">{{ option.name }}</span>
              @if (option.subtitle) {
                <span class="option-subtitle">{{ option.subtitle }}</span>
              }
            </button>
          }
        </div>
      }
    </div>

    <button type="button" class="add-link" (click)="addNew.emit()">
      <lucide-icon [name]="ICONS.PLUS" [size]="14" />
      {{ addLabel() }}
    </button>
  `,
  styles: [`
    .dropdown-wrapper {
      position: relative;
    }

    .dropdown-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .dropdown-search .search-icon {
      position: absolute;
      left: 12px;
      color: #9ca3af;
    }

    .dropdown-search .form-input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: all 0.15s ease;
    }

    .dropdown-search .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      border: none;
      border-radius: 50%;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-btn:hover {
      background: #d1d5db;
      color: #374151;
    }

    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
    }

    .dropdown-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .dropdown-option:hover {
      background: #f3f4f6;
    }

    .dropdown-option--selected {
      background: #eff6ff;
    }

    .option-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .option-subtitle {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .dropdown-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .dropdown-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e5e7eb;
      border-top-color: var(--color-primary, #1e3a5f);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .add-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 0;
      background: none;
      border: none;
      font-size: 0.8125rem;
      color: var(--color-primary, #1e3a5f);
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .add-link:hover {
      color: var(--color-primary-dark, #152a45);
      text-decoration: underline;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SearchableDropdownComponent {
  readonly placeholder = input<string>('Keresés...');
  readonly addLabel = input<string>('Új hozzáadása');
  readonly options = input.required<DropdownOption[]>();
  readonly loading = input<boolean>(false);
  readonly selectedItem = input<DropdownOption | null>(null);

  readonly searchChange = output<string>();
  readonly itemSelected = output<DropdownOption>();
  readonly cleared = output<void>();
  readonly addNew = output<void>();

  readonly ICONS = ICONS;
  readonly showDropdown = signal(false);
  readonly searchText = signal('');

  onFocus(): void {
    this.showDropdown.set(true);
    if (this.options().length === 0) {
      this.searchChange.emit('');
    }
  }

  onBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.dropdown-list')) {
      return;
    }
    this.showDropdown.set(false);
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.searchChange.emit(value);
  }

  select(option: DropdownOption): void {
    this.searchText.set(option.name + (option.subtitle ? ` (${option.subtitle})` : ''));
    this.itemSelected.emit(option);
    this.showDropdown.set(false);
  }

  clear(): void {
    this.searchText.set('');
    this.cleared.emit();
  }
}
