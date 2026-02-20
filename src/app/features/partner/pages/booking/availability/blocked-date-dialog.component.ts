import {
  Component, output, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-blocked-date-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      variant="create"
      headerStyle="flat"
      theme="red"
      [icon]="ICONS.BAN"
      title="Tiltott nap hozzáadása"
      size="sm"
      [errorMessage]="errorMsg()"
      (closeEvent)="close.emit()"
      (submitEvent)="onSave()"
      (backdropClickEvent)="close.emit()">
      <div dialogBody>
        <div class="field">
          <label for="bd-start">Kezdő dátum *</label>
          <input id="bd-start" type="date" [(ngModel)]="startDate" class="input" />
        </div>
        <div class="field">
          <label for="bd-end">Záró dátum *</label>
          <input id="bd-end" type="date" [(ngModel)]="endDate" class="input" />
        </div>
        <div class="field">
          <label for="bd-reason">Indoklás</label>
          <textarea id="bd-reason" [(ngModel)]="reason" rows="2" class="input" placeholder="pl. Szabadság..."></textarea>
        </div>
      </div>
      <ng-container dialogFooter>
        <button class="btn btn--outline" (click)="close.emit()">Mégse</button>
        <button class="btn btn--red" [disabled]="!isValid()" (click)="onSave()">
          <lucide-icon [name]="ICONS.PLUS" [size]="16" /> Hozzáadás
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;
      label { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    }
    .input {
      padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9375rem; width: 100%; box-sizing: border-box;
      &:focus { outline: none; border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    }
    textarea.input { resize: vertical; font-family: inherit; }
  `],
})
export class BlockedDateDialogComponent {
  readonly close = output<void>();
  readonly saved = output<{ start_date: string; end_date: string; reason?: string }>();
  readonly ICONS = ICONS;

  startDate = '';
  endDate = '';
  reason = '';
  errorMsg = signal<string | null>(null);

  isValid(): boolean {
    return this.startDate.length > 0 && this.endDate.length > 0 && this.endDate >= this.startDate;
  }

  onSave(): void {
    if (!this.isValid()) {
      this.errorMsg.set('Kérlek add meg a kezdő és záró dátumot.');
      return;
    }
    this.saved.emit({
      start_date: this.startDate,
      end_date: this.endDate,
      reason: this.reason.trim() || undefined,
    });
  }
}
