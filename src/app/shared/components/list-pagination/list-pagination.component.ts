import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';
import { PsSelectComponent, PsSelectOption } from '@shared/components/form';

@Component({
  selector: 'app-list-pagination',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsSelectComponent],
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
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly pageOptions = computed<PsSelectOption[]>(() =>
    this.pages().map(p => ({ id: String(p), label: `${p}. oldal` }))
  );

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }

  onSelectChange(value: string | number): void {
    const page = Number(value);
    this.goToPage(page);
  }
}
