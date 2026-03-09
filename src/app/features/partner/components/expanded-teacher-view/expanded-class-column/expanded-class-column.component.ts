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

      const card = listContainer.querySelector(`[data-person-id="${matchInThisColumn.personId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
}
