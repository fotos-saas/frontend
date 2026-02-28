import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { QuoteTemplate } from '../../../../models/quote.models';

@Component({
  selector: 'app-template-chooser-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      title="Sablon választása"
      icon="copy"
      headerStyle="flat"
      theme="purple"
      size="md"
      (closeEvent)="close.emit()"
    >
      <div dialogBody>
        @if (templates().length === 0) {
          <p class="empty-text">Nincsenek elérhető sablonok</p>
        } @else {
          <div class="template-list">
            @for (tpl of templates(); track tpl.id) {
              <button class="template-card" (click)="select.emit(tpl.id)">
                <div class="template-info">
                  <span class="template-name">{{ tpl.template_name || 'Névtelen sablon' }}</span>
                  <span class="template-meta">
                    {{ tpl.quote_category === 'photographer' ? 'Fotós' : 'Egyedi' }}
                    @if (tpl.base_price) {
                      · {{ formatPrice(tpl.discount_price || tpl.base_price) }}
                    }
                  </span>
                </div>
                <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
              </button>
            }
          </div>
        }
      </div>
    </app-dialog-wrapper>
  `,
  styles: [`
    .template-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .template-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      width: 100%;
      &:hover {
        border-color: var(--color-primary, #1e3a5f);
        background: #f8fafc;
      }
    }
    .template-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .template-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
    }
    .template-meta {
      font-size: 0.75rem;
      color: #64748b;
    }
    .empty-text {
      text-align: center;
      color: #94a3b8;
      padding: 24px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateChooserDialogComponent {
  readonly ICONS = ICONS;
  readonly templates = input.required<QuoteTemplate[]>();
  readonly select = output<number>();
  readonly close = output<void>();

  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price) + ' Ft';
  }
}
