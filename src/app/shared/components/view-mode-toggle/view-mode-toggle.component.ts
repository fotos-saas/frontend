import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface ViewModeOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-view-mode-toggle',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-mode-toggle.component.html',
  styleUrl: './view-mode-toggle.component.scss',
})
export class ViewModeToggleComponent {
  readonly options = input.required<ViewModeOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
}
