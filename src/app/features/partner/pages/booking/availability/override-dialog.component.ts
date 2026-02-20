import {
  Component, output, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-override-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      variant="create"
      headerStyle="flat"
      theme="blue"
      [icon]="ICONS.CLOCK"
      title="Speciális időpont hozzáadása"
      size="sm"
      [errorMessage]="errorMsg()"
      (closeEvent)="close.emit()"
      (submitEvent)="onSave()"
      (backdropClickEvent)="close.emit()">
      <div dialogBody>
        <div class="field">
          <label for="ov-date">Dátum *</label>
          <input id="ov-date" type="date" [(ngModel)]="date" class="input" />
        </div>
        <div class="time-row">
          <div class="field">
            <label for="ov-start">Kezdés *</label>
            <input id="ov-start" type="time" [(ngModel)]="startTime" class="input" />
          </div>
          <div class="field">
            <label for="ov-end">Befejezés *</label>
            <input id="ov-end" type="time" [(ngModel)]="endTime" class="input" />
          </div>
        </div>
        <div class="field">
          <label for="ov-note">Megjegyzés</label>
          <input id="ov-note" type="text" [(ngModel)]="note" class="input" placeholder="pl. Hétvégi pótidőpont" />
        </div>
      </div>
      <ng-container dialogFooter>
        <button class="btn btn--outline" (click)="close.emit()">Mégse</button>
        <button class="btn btn--blue" [disabled]="!isValid()" (click)="onSave()">
          <lucide-icon [name]="ICONS.PLUS" [size]="16" /> Hozzáadás
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;
      label { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    }
    .time-row { display: flex; gap: 12px;
      .field { flex: 1; }
    }
    .input {
      padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9375rem; width: 100%; box-sizing: border-box;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    }
  `],
})
export class OverrideDialogComponent {
  readonly close = output<void>();
  readonly saved = output<{ date: string; start_time: string; end_time: string; note?: string }>();
  readonly ICONS = ICONS;

  date = '';
  startTime = '';
  endTime = '';
  note = '';
  errorMsg = signal<string | null>(null);

  isValid(): boolean {
    return this.date.length > 0 && this.startTime.length > 0 && this.endTime.length > 0 && this.endTime > this.startTime;
  }

  onSave(): void {
    if (!this.isValid()) {
      this.errorMsg.set('Kérlek töltsd ki az összes kötelező mezőt.');
      return;
    }
    this.saved.emit({
      date: this.date,
      start_time: this.startTime,
      end_time: this.endTime,
      note: this.note.trim() || undefined,
    });
  }
}
