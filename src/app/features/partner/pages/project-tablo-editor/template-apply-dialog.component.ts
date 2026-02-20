import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { TemplateListItem } from '@core/services/electron.types';

@Component({
  selector: 'app-template-apply-dialog',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      headerStyle="flat"
      theme="blue"
      [icon]="ICONS.LAYOUT_TEMPLATE"
      title="Sablon alkalmazása"
      description="Válaszd ki a sablont, ami alapján a személyek pozícióba kerülnek."
      size="md"
      [isSubmitting]="isApplying()"
      (closeEvent)="closeEvent.emit()"
    >
      <div dialogBody>
        @if (isLoading()) {
          <div class="template-loading">
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
            Sablonok betöltése...
          </div>
        } @else if (templates().length === 0) {
          <div class="template-empty">
            <lucide-icon [name]="ICONS.LAYOUT_TEMPLATE" [size]="24" />
            <p>Még nincsenek mentett sablonok.</p>
            <p class="template-empty__hint">Először ments egy sablont a "Sablon mentése" gombbal.</p>
          </div>
        } @else {
          <div class="template-list">
            @for (tmpl of templates(); track tmpl.id) {
              <div
                class="template-item"
                [class.template-item--selected]="selectedId() === tmpl.id"
                (click)="selectTemplate(tmpl)"
              >
                <div class="template-item__info">
                  @if (editingId() === tmpl.id) {
                    <input
                      type="text"
                      class="template-item__edit-input"
                      [value]="editingNameValue()"
                      (input)="editingNameChange.emit($any($event.target).value)"
                      (keydown.enter)="commitRename.emit()"
                      (keydown.escape)="cancelRename.emit()"
                      (blur)="commitRename.emit()"
                      (click)="$event.stopPropagation()"
                    />
                  } @else {
                    <span class="template-item__name">{{ tmpl.templateName }}</span>
                  }
                  <span class="template-item__meta">
                    {{ tmpl.studentSlotCount }} diák + {{ tmpl.teacherSlotCount }} tanár
                    · {{ tmpl.boardWidthCm }}×{{ tmpl.boardHeightCm }} cm
                  </span>
                  <span class="template-item__date">
                    {{ formatDate(tmpl.createdAt) }}
                  </span>

                  @if (selectedId() === tmpl.id && currentPersonCount() > 0) {
                    <span class="template-item__comparison">
                      @if (currentPersonCount() > tmpl.studentSlotCount) {
                        <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="12" />
                        +{{ currentPersonCount() - tmpl.studentSlotCount }} diák új grid pozícióba kerül
                      } @else if (currentPersonCount() < tmpl.studentSlotCount) {
                        <lucide-icon [name]="ICONS.INFO" [size]="12" />
                        {{ tmpl.studentSlotCount - currentPersonCount() }} üres slot marad
                      } @else {
                        <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="12" />
                        Pontos egyezés
                      }
                    </span>
                  }
                </div>

                <div class="template-item__actions" (click)="$event.stopPropagation()">
                  <button
                    class="btn btn--sm btn--outline"
                    (click)="startRename.emit(tmpl)"
                    matTooltip="Átnevezés"
                  >
                    <lucide-icon [name]="ICONS.EDIT" [size]="14" />
                  </button>
                  <button
                    class="btn btn--sm btn--outline"
                    (click)="deleteTemplate.emit(tmpl.id)"
                    matTooltip="Törlés"
                  >
                    <lucide-icon [name]="ICONS.DELETE" [size]="14" />
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div dialogFooter>
        <button class="btn btn--outline" (click)="closeEvent.emit()">
          Mégse
        </button>
        <button
          class="btn btn--primary"
          [disabled]="!selectedId() || isApplying()"
          (click)="applyEvent.emit(selectedId()!)"
        >
          @if (isApplying()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
            Alkalmazás...
          } @else {
            <lucide-icon [name]="ICONS.LAYOUT_TEMPLATE" [size]="16" />
            Sablon alkalmazása
          }
        </button>
      </div>
    </app-dialog-wrapper>
  `,
  styles: [`
    .template-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 24px;
      color: #6b7280;
    }

    .template-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: #9ca3af;
      text-align: center;

      p { margin: 4px 0; }

      &__hint {
        font-size: 12px;
        color: #d1d5db;
      }
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 320px;
      overflow-y: auto;
    }

    .template-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      &--selected {
        background: rgba(59, 130, 246, 0.05);
        border-color: #3b82f6;
      }

      &__info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      &__name {
        font-weight: 500;
        font-size: 14px;
        color: #111827;
      }

      &__meta {
        font-size: 12px;
        color: #6b7280;
      }

      &__date {
        font-size: 11px;
        color: #9ca3af;
      }

      &__comparison {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;

        lucide-icon { flex-shrink: 0; }
      }

      &__edit-input {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #3b82f6;
        border-radius: 4px;
        font-size: 14px;
        outline: none;
      }

      &__actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
        margin-left: 8px;
      }
    }
  `],
})
export class TemplateApplyDialogComponent {
  protected readonly ICONS = ICONS;

  readonly templates = input.required<TemplateListItem[]>();
  readonly isLoading = input(false);
  readonly isApplying = input(false);
  readonly currentPersonCount = input(0);
  readonly editingId = input<string | null>(null);
  readonly editingNameValue = input('');

  readonly closeEvent = output<void>();
  readonly applyEvent = output<string>();
  readonly deleteTemplate = output<string>();
  readonly startRename = output<TemplateListItem>();
  readonly commitRename = output<void>();
  readonly cancelRename = output<void>();
  readonly editingNameChange = output<string>();

  readonly selectedId = signal<string | null>(null);

  selectTemplate(tmpl: TemplateListItem): void {
    this.selectedId.set(tmpl.id);
  }

  formatDate(isoDate: string): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}
