import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

@Component({
  selector: 'app-list-pagination',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-pagination.component.html',
  styleUrl: './list-pagination.component.scss',
})
export class ListPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly itemLabel = input<string>('elem');
  readonly pageChange = output<number>();

  readonly ICONS = ICONS;

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }
}
