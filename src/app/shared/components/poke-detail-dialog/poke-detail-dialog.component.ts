import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { PokeService } from '../../../core/services/poke.service';
import { Poke } from '../../../core/models/poke.models';
import { DateUtilsService } from '../../services/date-utils.service';

/**
 * Poke Detail Dialog Component
 *
 * Egy bökés részleteinek megjelenítése dialógusban.
 * Értesítésből kattintáskor jelenik meg.
 */
@Component({
  selector: 'app-poke-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="dialog-overlay"
      (mousedown)="onBackdropMouseDown($event)"
      (click)="onBackdropClick($event)"
    >
      <div class="dialog-content" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <!-- Header -->
        <header class="dialog-header">
          <h2 id="dialog-title" class="dialog-title">Bökés részletei</h2>
          <button
            type="button"
            class="dialog-close"
            (click)="close()"
            aria-label="Bezárás"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- Body -->
        <div class="dialog-body">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Betöltés...</p>
            </div>
          } @else if (poke()) {
            <div class="poke-detail">
              <!-- Emoji + Message -->
              <div class="poke-message">
                @if (poke()!.emoji) {
                  <span class="poke-emoji">{{ poke()!.emoji }}</span>
                }
                <p class="poke-text">{{ poke()!.text || 'Bökés' }}</p>
              </div>

              <!-- Meta info -->
              <div class="poke-meta">
                <div class="meta-row">
                  <span class="meta-label">Címzett:</span>
                  <span class="meta-value">{{ poke()!.target.name }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Kategória:</span>
                  <span class="meta-value category-badge" [class]="'category--' + poke()!.category">
                    {{ getCategoryLabel(poke()!.category) }}
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Időpont:</span>
                  <span class="meta-value">{{ formatDate(poke()!.createdAt) }}</span>
                </div>
              </div>

              <!-- Reaction (if any) -->
              @if (poke()!.reaction) {
                <div class="poke-reaction">
                  <span class="reaction-label">Reakció:</span>
                  <span class="reaction-emoji">{{ poke()!.reaction }}</span>
                  @if (poke()!.reactedAt) {
                    <span class="reaction-time">{{ formatTime(poke()!.reactedAt!) }}</span>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <p>A bökés nem található.</p>
            </div>
          }
        </div>

        <!-- Footer -->
        <footer class="dialog-footer">
          <button
            type="button"
            class="btn-secondary"
            (click)="close()"
          >
            Bezárás
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-dialog, 1000);
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .dialog-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .dialog-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #f3f4f6;
      }

      svg {
        width: 20px;
        height: 20px;
        color: #6b7280;
      }
    }

    .dialog-body {
      padding: 1.5rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    // Loading
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #6b7280;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    // Poke detail
    .poke-detail {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .poke-message {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
    }

    .poke-emoji {
      font-size: 2rem;
      line-height: 1;
    }

    .poke-text {
      margin: 0;
      font-size: 1rem;
      color: #374151;
      line-height: 1.5;
      padding-top: 0.25rem;
    }

    .poke-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .meta-label {
      font-size: 0.875rem;
      color: #6b7280;
      min-width: 80px;
    }

    .meta-value {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 500;
    }

    .category-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;

      &.category--voting {
        background: #dbeafe;
        color: #1d4ed8;
      }

      &.category--photoshoot {
        background: #fef3c7;
        color: #b45309;
      }

      &.category--image_selection {
        background: #d1fae5;
        color: #047857;
      }

      &.category--general {
        background: #f3f4f6;
        color: #4b5563;
      }
    }

    .poke-reaction {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
    }

    .reaction-label {
      font-size: 0.875rem;
      color: #78350f;
    }

    .reaction-emoji {
      font-size: 1.5rem;
    }

    .reaction-time {
      font-size: 0.75rem;
      color: #92400e;
      margin-left: auto;
    }

    // Empty state
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    // Button
    .btn-secondary {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #e5e7eb;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeDetailDialogComponent extends BaseDialogComponent implements OnInit {
  private readonly pokeService = inject(PokeService);
  private readonly dateUtils = inject(DateUtilsService);

  /** Bökés ID (értesítésből jön) */
  readonly pokeId = input.required<number>();

  /** Bezárás event */
  readonly closed = output<void>();

  /** Betöltött bökés */
  readonly poke = signal<Poke | null>(null);

  /** Betöltés állapot */
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadPoke();
  }

  /**
   * Bökés betöltése
   * Először a sent pokes-ből próbáljuk, ha nincs, a received-ből
   */
  private loadPoke(): void {
    const id = this.pokeId();

    // Keresés a küldött bökések között
    const sentPoke = this.pokeService.sentPokes().find(p => p.id === id);
    if (sentPoke) {
      this.poke.set(sentPoke);
      this.loading.set(false);
      return;
    }

    // Keresés a kapott bökések között
    const receivedPoke = this.pokeService.receivedPokes().find(p => p.id === id);
    if (receivedPoke) {
      this.poke.set(receivedPoke);
      this.loading.set(false);
      return;
    }

    // Ha nincs meg, frissítsük a listákat
    this.pokeService.loadSentPokes().subscribe({
      next: () => {
        const poke = this.pokeService.sentPokes().find(p => p.id === id);
        this.poke.set(poke || null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      voting: 'Szavazás',
      photoshoot: 'Fotózás',
      image_selection: 'Képválasztás',
      general: 'Általános'
    };
    return labels[category] || category;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateStr: string): string {
    return this.dateUtils.getRelativeTime(dateStr);
  }

  protected onSubmit(): void {
    // Nincs submit
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
