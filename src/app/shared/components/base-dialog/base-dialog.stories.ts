import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { Component } from '@angular/core';
import { BaseDialogComponent } from './base-dialog.component';

/**
 * ## Base Dialog
 *
 * Absztrakt alap dialógus komponens, amely közös funkcionalitást biztosít az összes dialógusnak.
 *
 * ### Biztosított funkciók:
 * - **Body scroll lock** (Safari kompatibilis)
 * - **Focus trap** és visszaállítás
 * - **ESC** billentyű kezelés
 * - **Backdrop** kattintás kezelés (kijelölés közbeni bezárás megelőzése)
 * - **Állapot kezelés:** isSubmitting, errorMessage
 * - **Submit/Close** lifecycle
 *
 * ### Használat:
 * ```typescript
 * export class MyDialogComponent extends BaseDialogComponent {
 *   protected onSubmit(): void { ... }
 *   protected onClose(): void { ... }
 * }
 * ```
 *
 * Ez egy absztrakt komponens, közvetlenül nem renderelhető.
 * Az alábbi story egy konkrét implementációt mutat be.
 */

@Component({
  selector: 'storybook-base-dialog-impl',
  standalone: true,
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="onBackdropMouseDown($event)"
      (click)="onBackdropClick($event)"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"
    >
      <div
        class="dialog-panel"
        style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);"
      >
        <h2 style="margin: 0 0 8px; font-size: 18px; color: #1e293b;">Példa dialógus</h2>
        <p style="margin: 0 0 16px; color: #64748b; font-size: 14px;">
          Ez a BaseDialogComponent egy konkrét implementációja.
        </p>

        @if (errorMessage()) {
          <div style="padding: 8px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #dc2626; font-size: 13px; margin-bottom: 12px;">
            {{ errorMessage() }}
          </div>
        }

        <div style="display: flex; justify-content: flex-end;">
          <button
            (click)="close()"
            style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #475569; margin-right: 8px;"
          >
            Mégse
          </button>
          <button
            (click)="submit()"
            [disabled]="isSubmitting()"
            style="padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer;"
          >
            {{ isSubmitting() ? 'Mentés...' : 'Mentés' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
class BaseDialogImplComponent extends BaseDialogComponent {
  protected onSubmit(): void {
    // Szimulált mentés
    setTimeout(() => this.submitSuccess(), 1500);
  }

  protected onClose(): void {
    this.dialogCloseEvent.emit();
  }
}

const meta: Meta<BaseDialogImplComponent> = {
  title: 'Shared/Dialogs/BaseDialog',
  component: BaseDialogImplComponent,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<BaseDialogImplComponent>;

/**
 * Alapértelmezett állapot
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'A BaseDialogComponent egy konkrét implementációja alapértelmezett állapotban.',
      },
    },
  },
};
