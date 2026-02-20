import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ModuleFaqItem } from '../../module-detail.types';

@Component({
  selector: 'app-detail-faq',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detail-faq.component.html',
  styleUrl: './detail-faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailFaqComponent {
  readonly faq = input.required<ModuleFaqItem[]>();
  readonly openIndex = signal<number | null>(null);

  readonly ICONS = ICONS;

  toggle(index: number): void {
    this.openIndex.update(current => current === index ? null : index);
  }
}
