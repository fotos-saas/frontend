import {
  Component, ChangeDetectionStrategy, input, output, signal, computed,
} from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PersonItem } from '../overlay-project.service';

export interface DragOrderSavedEvent {
  positions: Array<{ id: number; position: number }>;
  orderedNames: string[];
  scope: 'all' | 'teachers' | 'students';
}

@Component({
  selector: 'app-drag-order-panel',
  standalone: true,
  imports: [DragDropModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './drag-order-panel.component.html',
  styleUrl: './drag-order-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragOrderPanelComponent {
  protected readonly ICONS = ICONS;

  readonly persons = input.required<PersonItem[]>();
  readonly saving = input(false);
  readonly close = output<void>();
  readonly saved = output<DragOrderSavedEvent>();

  readonly scope = signal<'all' | 'teachers' | 'students'>('students');
  readonly orderedList = signal<PersonItem[]>([]);
  private initialized = false;

  readonly scopedPersons = computed(() => {
    const all = this.persons();
    const s = this.scope();
    if (s === 'teachers') return all.filter(p => p.type === 'teacher');
    if (s === 'students') return all.filter(p => p.type === 'student');
    return all;
  });

  /** Lista inicializálása scope váltáskor */
  ngDoCheck(): void {
    const scoped = this.scopedPersons();
    if (!this.initialized || this.orderedList().length !== scoped.length) {
      this.orderedList.set([...scoped]);
      this.initialized = true;
    }
  }

  setScope(scope: 'all' | 'teachers' | 'students'): void {
    this.scope.set(scope);
    this.initialized = false;
  }

  onDrop(event: CdkDragDrop<PersonItem[]>): void {
    const list = [...this.orderedList()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.orderedList.set(list);
  }

  save(): void {
    const list = this.orderedList();
    const positions = list.map((p, i) => ({ id: p.id, position: i + 1 }));
    const orderedNames = list.map(p => p.name);
    this.saved.emit({ positions, orderedNames, scope: this.scope() });
  }
}
