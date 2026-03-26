import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-deadline-modification-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './deadline-modification-banner.component.html',
  styleUrl: './deadline-modification-banner.component.scss',
})
export class DeadlineModificationBannerComponent {
  readonly proposedDate = input.required<string>();
  readonly originalDeadline = input.required<string>();
  readonly reason = input<string | null>(null);

  readonly accept = output<void>();
  readonly reject = output<void>();

  protected readonly ICONS = ICONS;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
