import { Component, ChangeDetectionStrategy, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

export interface SortOption {
  value: string;
  label: string;
}

/**
 * Mobil rendezés komponens - dropdown a mobil nézethez.
 */
@Component({
  selector: 'app-project-mobile-sort',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mobile-sort-bar">
      <div class="mobile-sort-group">
        <label class="mobile-sort-label">Rendezés:</label>
        <div class="mobile-sort-dropdown">
          <button
            type="button"
            class="mobile-sort-trigger"
            (click)="toggleDropdown()"
          >
            <span>{{ getCurrentLabel() }}</span>
            <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="16" />
          </button>
          @if (isOpen()) {
            <div class="mobile-sort-options">
              @for (opt of options(); track opt.value) {
                <button
                  type="button"
                  class="mobile-sort-option"
                  [class.mobile-sort-option--active]="sortBy() === opt.value"
                  (click)="selectOption(opt.value)"
                >
                  @if (sortBy() === opt.value) {
                    <lucide-icon [name]="ICONS.CHECK" [size]="14" />
                  }
                  {{ opt.label }}
                </button>
              }
            </div>
          }
        </div>
        <button
          type="button"
          class="mobile-sort-dir-btn"
          (click)="toggleDirection()"
          [attr.aria-label]="sortDir() === 'asc' ? 'Növekvő sorrend' : 'Csökkenő sorrend'"
        >
          <lucide-icon [name]="sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="16" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mobile-sort-bar {
      display: none;
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
    }

    .mobile-sort-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mobile-sort-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }

    .mobile-sort-dropdown {
      position: relative;
      flex: 1;
    }

    .mobile-sort-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .mobile-sort-trigger:hover {
      border-color: #cbd5e1;
    }

    .mobile-sort-trigger:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .mobile-sort-options {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 100;
      overflow: hidden;
      animation: dropdownFadeIn 0.15s ease;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mobile-sort-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }

    .mobile-sort-option:hover {
      background: #f1f5f9;
    }

    .mobile-sort-option--active {
      background: #e0f2fe;
      color: var(--color-primary, #1e3a5f);
      font-weight: 500;
    }

    .mobile-sort-option--active:hover {
      background: #bae6fd;
    }

    .mobile-sort-dir-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s ease;
    }

    .mobile-sort-dir-btn:hover {
      background: #f1f5f9;
      border-color: var(--color-primary, #1e3a5f);
      color: var(--color-primary, #1e3a5f);
    }

    .mobile-sort-dir-btn:active {
      transform: scale(0.95);
    }

    @media (max-width: 640px) {
      .mobile-sort-bar {
        display: block;
      }
    }
  `]
})
export class ProjectMobileSortComponent {
  readonly options = input.required<SortOption[]>();
  readonly sortBy = input.required<string>();
  readonly sortDir = input.required<'asc' | 'desc'>();
  readonly sortByChange = output<string>();
  readonly sortDirChange = output<void>();

  readonly ICONS = ICONS;
  readonly isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mobile-sort-dropdown')) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  getCurrentLabel(): string {
    const opt = this.options().find(o => o.value === this.sortBy());
    return opt?.label || 'Rendezés';
  }

  selectOption(value: string): void {
    this.isOpen.set(false);
    this.sortByChange.emit(value);
  }

  toggleDirection(): void {
    this.sortDirChange.emit();
  }
}
