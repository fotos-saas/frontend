import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-template-save-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      headerStyle="flat"
      theme="green"
      [icon]="ICONS.SAVE"
      title="Sablon mentése"
      description="Add meg a sablon nevét. Az aktuális Photoshop elrendezés sablonként kerül mentésre."
      size="sm"
      variant="create"
      [isSubmitting]="isSaving()"
      (closeEvent)="closeEvent.emit()"
      (submitEvent)="name().trim() ? submitEvent.emit() : null"
    >
      <div dialogBody>
        <input
          type="text"
          class="snapshot-dialog__input"
          placeholder="pl. Klasszikus 4x8"
          [value]="name()"
          (input)="nameChange.emit($any($event.target).value)"
        />

        @if (studentSlotCount() > 0 || teacherSlotCount() > 0) {
          <p class="template-info">
            <lucide-icon [name]="ICONS.INFO" [size]="14" />
            {{ studentSlotCount() }} diák + {{ teacherSlotCount() }} tanár slot fog keletkezni
          </p>
        }
      </div>

      <div dialogFooter>
        <button class="btn btn--outline" (click)="closeEvent.emit()">
          Mégse
        </button>
        <button
          class="btn btn--primary"
          [disabled]="!name().trim() || isSaving()"
          (click)="submitEvent.emit()"
        >
          @if (isSaving()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
            Mentés...
          } @else {
            <lucide-icon [name]="ICONS.SAVE" [size]="16" />
            Mentés
          }
        </button>
      </div>
    </app-dialog-wrapper>
  `,
  styles: [`
    .template-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 12px;
      background: rgba(34, 197, 94, 0.08);
      border-radius: 8px;
      font-size: 13px;
      color: #15803d;
    }
  `],
})
export class TemplateSaveDialogComponent {
  protected readonly ICONS = ICONS;

  readonly name = input.required<string>();
  readonly isSaving = input(false);
  readonly studentSlotCount = input(0);
  readonly teacherSlotCount = input(0);

  readonly nameChange = output<string>();
  readonly closeEvent = output<void>();
  readonly submitEvent = output<void>();
}
