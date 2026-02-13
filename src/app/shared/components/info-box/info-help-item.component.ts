import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type InfoHelpColor = 'purple' | 'indigo' | 'teal' | 'emerald' | 'blue' | 'amber' | 'red';

@Component({
  selector: 'app-info-help-item',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="item">
      <div class="icon" [class]="'icon icon--' + color()">
        <lucide-icon [name]="icon()" [size]="18" />
      </div>
      <div class="text">
        <strong>{{ title() }}</strong>
        <p><ng-content /></p>
      </div>
    </div>
  `,
  styles: [`
    .item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .text {
      flex: 1;
      min-width: 0;
    }

    strong {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }

    p {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.5;
      color: #64748b;
    }

    .icon {
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      margin-right: 12px;

      &--purple  { background: #f3e8ff; color: #9333ea; }
      &--indigo  { background: #e0e7ff; color: #4f46e5; }
      &--teal    { background: #ccfbf1; color: #0d9488; }
      &--emerald { background: #d1fae5; color: #059669; }
      &--blue    { background: #dbeafe; color: #3b82f6; }
      &--amber   { background: #fef3c7; color: #d97706; }
      &--red     { background: #fee2e2; color: #dc2626; }
    }
  `],
})
export class InfoHelpItemComponent {
  icon = input.required<string>();
  title = input.required<string>();
  color = input<InfoHelpColor>('blue');
}
