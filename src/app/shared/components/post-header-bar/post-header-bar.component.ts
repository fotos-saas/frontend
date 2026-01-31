import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { DeleteButtonComponent, EditButtonComponent } from '../action-buttons';

/**
 * Badge típus definíció
 */
export interface BadgeConfig {
  type: 'announcement' | 'event' | 'pinned' | 'locked' | 'template' | 'custom';
  label: string;
  icon?: 'announcement' | 'calendar' | 'pin' | 'lock' | 'template';
  color?: 'primary' | 'warning' | 'purple' | 'gray';
}

/**
 * PostHeaderBarComponent
 *
 * Újrahasználható header bar kártyákhoz és posztokhoz.
 * Badge-ek, action gombok és pin jelző megjelenítése.
 *
 * @example
 * <app-post-header-bar
 *   [badges]="[{ type: 'announcement', label: 'Bejelentés', icon: 'announcement' }]"
 *   [isPinned]="post.isPinned"
 *   [showActions]="canEdit"
 *   (editClick)="onEdit()"
 *   (deleteClick)="onDelete()"
 * />
 */
@Component({
  selector: 'app-post-header-bar',
  standalone: true,
  imports: [EditButtonComponent, DeleteButtonComponent],
  template: `
    <div class="post-header-bar">
      <!-- Badges -->
      <div class="post-header-bar__badges">
        @for (badge of badges(); track badge.type) {
          <span
            class="post-header-bar__badge"
            [class.post-header-bar__badge--primary]="badge.color === 'primary' || !badge.color"
            [class.post-header-bar__badge--warning]="badge.color === 'warning'"
            [class.post-header-bar__badge--purple]="badge.color === 'purple'"
            [class.post-header-bar__badge--gray]="badge.color === 'gray'"
          >
            @if (badge.icon === 'announcement') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            } @else if (badge.icon === 'calendar') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            } @else if (badge.icon === 'pin') {
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            } @else if (badge.icon === 'lock') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            } @else if (badge.icon === 'template') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            }
            {{ badge.label }}
          </span>
        }
      </div>

      <!-- Actions (pin/edit/delete) -->
      @if (showActions()) {
        <div class="post-header-bar__actions" (click)="$event.stopPropagation()">
          @if (showPinAction()) {
            <button
              type="button"
              class="post-header-bar__action-btn"
              [class.post-header-bar__action-btn--active]="isPinned()"
              (click)="pinClick.emit()"
              [title]="isPinned() ? 'Kitűzés levétele' : 'Kitűzés'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M12 17v5"/>
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
              </svg>
            </button>
          }
          @if (showEditDelete()) {
            <app-edit-button
              display="icon-only"
              (clicked)="editClick.emit()"
            />
            <app-delete-button
              display="icon-only"
              (clicked)="deleteClick.emit()"
            />
          }
        </div>
      }

      <!-- Pin indicator (standalone, jobb szélen) -->
      @if (isPinned() && !hasPinBadge()) {
        <span class="post-header-bar__pin" title="Kitűzött">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
        </span>
      }
    </div>
  `,
  styles: [`
    @use '../../../../styles/colors' as colors;
    @use '../../../../styles/mixins' as *;

    .post-header-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &__badges {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      &__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 9999px;
        @include card-badge-shine;

        svg {
          width: 0.875rem;
          height: 0.875rem;
        }

        &--primary {
          color: colors.get-color('primary', 500);
          background: colors.get-color('primary', 50);
        }

        &--warning {
          color: colors.get-color('warning', 600);
          background: colors.get-color('warning', 50);
        }

        &--purple {
          color: #a855f7;
          background: #faf5ff;
        }

        &--gray {
          color: colors.get-color('gray', 600);
          background: colors.get-color('gray', 100);
        }
      }

      &__actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-left: auto;
      }

      &__action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        color: colors.get-color('gray', 400);
        transition: all 0.15s ease;

        svg {
          width: 1rem;
          height: 1rem;
        }

        &:hover {
          background: colors.get-color('gray', 100);
          color: colors.get-color('warning', 500);
        }

        &--active {
          color: colors.get-color('warning', 500);

          &:hover {
            color: colors.get-color('warning', 600);
          }
        }
      }

      &__pin {
        display: flex;
        align-items: center;
        justify-content: center;
        color: colors.get-color('warning', 500);

        svg {
          width: 1rem;
          height: 1rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostHeaderBarComponent {
  /** Badge-ek listája */
  readonly badges = input<BadgeConfig[]>([]);

  /** Kitűzött-e (önálló pin ikon megjelenítése) */
  readonly isPinned = input<boolean>(false);

  /** Action gombok megjelenítése */
  readonly showActions = input<boolean>(false);

  /** Pin action gomb megjelenítése (csak kapcsolattartóknak) */
  readonly showPinAction = input<boolean>(false);

  /** Edit/Delete gombok megjelenítése (csak ha canEdit) */
  readonly showEditDelete = input<boolean>(false);

  /** Pin gomb kattintás */
  readonly pinClick = output<void>();

  /** Edit gomb kattintás */
  readonly editClick = output<void>();

  /** Delete gomb kattintás */
  readonly deleteClick = output<void>();

  /** Van-e már pin badge a listában */
  hasPinBadge(): boolean {
    return this.badges().some(b => b.type === 'pinned' || b.icon === 'pin');
  }
}
