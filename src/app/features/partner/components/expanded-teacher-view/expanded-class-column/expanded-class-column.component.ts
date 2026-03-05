import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ICONS } from '@shared/constants/icons.constants';
import { LucideAngularModule } from 'lucide-angular';
import { ExpandedClassData, ExpandedClassTeacher } from '../expanded-teacher-view.types';
import { ExpandedTeacherCardComponent } from '../expanded-teacher-card/expanded-teacher-card.component';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';

@Component({
  selector: 'app-expanded-class-column',
  standalone: true,
  imports: [LucideAngularModule, ExpandedTeacherCardComponent],
  templateUrl: './expanded-class-column.component.html',
  styleUrl: './expanded-class-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedClassColumnComponent {
  readonly ICONS = ICONS;
  private dataService = inject(ExpandedTeacherViewDataService);

  readonly classData = input.required<ExpandedClassData>();

  readonly matchingIds = computed(() => this.dataService.matchingPersonIds());
  readonly hoveredPersonId = computed(() => this.dataService.hoveredPersonId());
  readonly similarityGroup = computed(() => this.dataService.highlightedSimilarityGroup());

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
}
