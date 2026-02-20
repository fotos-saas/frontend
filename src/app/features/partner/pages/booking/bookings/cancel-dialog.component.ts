import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-cancel-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      variant="confirm"
      headerStyle="flat"
      theme="red"
      [icon]="ICONS.X_CIRCLE"
      title="Foglalás lemondása"
      size="sm"
      (closeEvent)="close.emit()"
      (submitEvent)="onConfirm()"
      (backdropClickEvent)="close.emit()">
      <div dialogBody>
        <div class="field">
          <label for="cancel-reason">Lemondás oka</label>
          <textarea id="cancel-reason" [(ngModel)]="reason" rows="3" class="input"
            placeholder="Indoklás (opcionális, az ügyfél is látni fogja)..."></textarea>
        </div>
      </div>
      <ng-container dialogFooter>
        <button class="btn btn--outline" (click)="close.emit()">Mégse</button>
        <button class="btn btn--red" (click)="onConfirm()">
          <lucide-icon [name]="ICONS.X_CIRCLE" [size]="16" /> Lemondás
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: 4px;
      label { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    }
    .input {
      padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9375rem;
      width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit;
      &:focus { outline: none; border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    }
  `],
})
export class CancelDialogComponent {
  readonly close = output<void>();
  readonly confirmed = output<string>();
  readonly ICONS = ICONS;

  reason = '';

  onConfirm(): void {
    this.confirmed.emit(this.reason.trim());
  }
}
