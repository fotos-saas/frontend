import { Component, ChangeDetectionStrategy, inject, output, signal, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';
import { createBackdropHandler } from '@shared/utils/dialog.util';

/**
 * Egyedi sorrend dialog — szabad szöveges névlista megadásához.
 */
@Component({
  selector: 'app-layout-sort-custom-dialog',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="dialog-backdrop"
         (mousedown)="backdropHandler.onMouseDown($event)"
         (click)="backdropHandler.onClick($event)">
      <div class="sort-dialog">
        <!-- Fejléc -->
        <div class="sort-dialog__header">
          <lucide-icon [name]="ICONS.LIST_ORDERED" [size]="20" />
          <span>Egyedi sorrend</span>
          <button class="sort-dialog__close" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="16" />
          </button>
        </div>

        <!-- Tartalom -->
        <div class="sort-dialog__body">
          <p class="sort-dialog__desc">
            Írd be a kívánt sorrendben a neveket, soronként egyet.
            Elég a keresztnév vagy rövidítés is — az AI párosítja a teljes nevekkel.
          </p>
          <textarea
            #textareaEl
            class="sort-dialog__textarea"
            [value]="text()"
            (input)="text.set(textareaEl.value)"
            placeholder="Kiss Anna&#10;Nagy Péter&#10;Szabó Gábor&#10;..."
            rows="10"
          ></textarea>
        </div>

        <!-- Footer -->
        <div class="sort-dialog__footer">
          <button class="sort-dialog__btn sort-dialog__btn--cancel" (click)="close.emit()">
            Mégse
          </button>
          <button class="sort-dialog__btn sort-dialog__btn--submit"
            [disabled]="!text().trim() || sortService.sorting()"
            (click)="submit()">
            @if (sortService.sorting()) {
              <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
              Feldolgozás...
            } @else {
              Rendezés
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    .sort-dialog {
      width: 100%;
      max-width: 480px;
      background: #2a2a4a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.25s ease;
    }

    .sort-dialog__header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .sort-dialog__close {
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.12s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }
    }

    .sort-dialog__body {
      padding: 20px;
    }

    .sort-dialog__desc {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;
      margin: 0 0 12px;
    }

    .sort-dialog__textarea {
      width: 100%;
      min-height: 200px;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.2);
      color: #ffffff;
      font-size: 0.85rem;
      font-family: inherit;
      line-height: 1.6;
      resize: vertical;
      outline: none;
      transition: border-color 0.15s ease;
      box-sizing: border-box;

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      &:focus {
        border-color: rgba(124, 58, 237, 0.5);
      }
    }

    .sort-dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sort-dialog__btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.12s ease;

      &--cancel {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);

        &:hover { background: rgba(255, 255, 255, 0.15); color: #ffffff; }
      }

      &--submit {
        background: #7c3aed;
        color: #ffffff;

        &:hover:not(:disabled) { background: #6d28d9; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSortCustomDialogComponent implements AfterViewInit {
  readonly sortService = inject(LayoutDesignerSortService);
  protected readonly ICONS = ICONS;

  readonly close = output<void>();
  readonly text = signal('');

  private readonly textareaEl = viewChild.required<ElementRef<HTMLTextAreaElement>>('textareaEl');
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  ngAfterViewInit(): void {
    this.textareaEl().nativeElement.focus();
  }

  async submit(): Promise<void> {
    const value = this.text().trim();
    if (!value) return;

    await this.sortService.sortByCustomOrder(value);
    this.close.emit();
  }
}
