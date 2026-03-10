import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LucideAngularModule } from 'lucide-angular';
import { ExpandedClassData, ExpandedClassTeacher } from '../expanded-teacher-view.types';
import { ExpandedTeacherCardComponent } from '../expanded-teacher-card/expanded-teacher-card.component';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';

@Component({
  selector: 'app-expanded-class-column',
  standalone: true,
  imports: [LucideAngularModule, ExpandedTeacherCardComponent, MatTooltipModule],
  templateUrl: './expanded-class-column.component.html',
  styleUrl: './expanded-class-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedClassColumnComponent {
  readonly ICONS = ICONS;
  private dataService = inject(ExpandedTeacherViewDataService);

  readonly classData = input.required<ExpandedClassData>();
  readonly isSource = input(false);
  readonly addTeacherRequest = output<number>();
  readonly listEl = viewChild<ElementRef<HTMLElement>>('listRef');

  readonly matchingIds = computed(() => this.dataService.matchingPersonIds());
  readonly hoveredPersonId = computed(() => this.dataService.hoveredPersonId());
  readonly similarityGroup = computed(() => this.dataService.highlightedSimilarityGroup());

  readonly filteredTeachers = computed(() => {
    const query = this.dataService.teacherSearch().trim().toLowerCase();
    const teachers = this.classData().teachers;
    if (!query) return teachers;
    return teachers.filter(t => t.name.toLowerCase().includes(query));
  });

  constructor() {
    effect(() => {
      const hoveredId = this.hoveredPersonId();
      const matching = this.matchingIds();
      if (!hoveredId || matching.size === 0) return;

      // Ne scrollozzunk abban az oszlopban, ahol a hover történt
      const isHoverSource = this.classData().teachers.some(t => t.personId === hoveredId);
      if (isHoverSource) return;

      // Keressük meg a matching tanárt ebben az oszlopban
      const matchInThisColumn = this.classData().teachers.find(t => matching.has(t.personId));
      if (!matchInThisColumn) return;

      const listContainer = this.listEl()?.nativeElement;
      if (!listContainer) return;

      const card = listContainer.querySelector(`[data-person-id="${matchInThisColumn.personId}"]`) as HTMLElement;
      if (card) {
        // Horizontális scroll lock: a szülő classes konténer pozícióját megőrizzük
        const classesContainer = listContainer.closest('.expanded-view__classes') as HTMLElement;
        const savedScrollLeft = classesContainer?.scrollLeft ?? 0;

        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Horizontális pozíció visszaállítása
        if (classesContainer) {
          classesContainer.scrollLeft = savedScrollLeft;
        }
      }
    });
  }

  getHighlightType(teacher: ExpandedClassTeacher): 'exact' | 'similar' | 'missing' | null {
    const matching = this.matchingIds();
    const simGroup = this.similarityGroup();

    if (matching.has(teacher.personId)) {
      return 'exact';
    }

    if (simGroup) {
      const isInGroup = simGroup.persons.some(p => p.personId === teacher.personId);
      if (isInGroup) {
        return 'similar';
      }
    }

    return null;
  }

  isHighlighted(teacher: ExpandedClassTeacher): boolean {
    return this.getHighlightType(teacher) !== null;
  }

  onTeacherHover(event: { normalizedName: string; personId: number } | null): void {
    if (event) {
      this.dataService.onTeacherHover(event.normalizedName, event.personId);
    } else {
      this.dataService.onTeacherHover(null, null);
    }
  }

  onTeacherSelect(personId: number): void {
    this.dataService.onTeacherSelect(personId);
  }

  onTeacherDrop(personId: number): void {
    const photo = this.dataService.draggedPhoto();
    if (photo) {
      this.dataService.handlePhotoDrop(photo.id, personId);
    }
  }

  onRemoveOverride(personId: number): void {
    this.dataService.removeOverride(personId);
  }

  onWheel(event: WheelEvent): void {
    const teachers = this.filteredTeachers();
    if (teachers.length === 0) return;

    event.preventDefault();

    const currentSelected = this.dataService.selectedPersonId();
    const currentIndex = currentSelected
      ? teachers.findIndex(t => t.personId === currentSelected)
      : -1;

    let nextIndex: number;
    if (event.deltaY > 0) {
      // Lefelé görgetés → következő
      nextIndex = currentIndex < teachers.length - 1 ? currentIndex + 1 : 0;
    } else {
      // Felfelé görgetés → előző
      nextIndex = currentIndex > 0 ? currentIndex - 1 : teachers.length - 1;
    }

    const nextTeacher = teachers[nextIndex];
    this.dataService.onTeacherSelect(nextTeacher.personId);

    // Scroll into view
    const listContainer = this.listEl()?.nativeElement;
    if (listContainer) {
      const card = listContainer.querySelector(`[data-person-id="${nextTeacher.personId}"]`) as HTMLElement;
      if (card) {
        const classesContainer = listContainer.closest('.expanded-view__classes') as HTMLElement;
        const savedScrollLeft = classesContainer?.scrollLeft ?? 0;
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (classesContainer) {
          classesContainer.scrollLeft = savedScrollLeft;
        }
      }
    }
  }
}
