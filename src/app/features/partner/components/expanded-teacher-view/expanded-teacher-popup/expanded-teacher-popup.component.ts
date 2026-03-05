import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';

interface OccurrenceItem {
  personId: number;
  projectId: number;
  name: string;
  className: string;
  schoolName: string;
  hasPhoto: boolean;
  photoThumbUrl: string | null;
}

@Component({
  selector: 'app-expanded-teacher-popup',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './expanded-teacher-popup.component.html',
  styleUrl: './expanded-teacher-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedTeacherPopupComponent {
  readonly ICONS = ICONS;
  private dataService = inject(ExpandedTeacherViewDataService);

  readonly personId = input.required<number>();
  readonly close = output<void>();

  readonly occurrences = computed<OccurrenceItem[]>(() => {
    const viewData = this.dataService.data();
    const pid = this.personId();
    if (!viewData) return [];

    // Kikeressük a person normalizált nevét
    let targetNormalized: string | null = null;
    for (const cls of viewData.classes) {
      const found = cls.teachers.find(t => t.personId === pid);
      if (found) {
        targetNormalized = found.normalizedName;
        break;
      }
    }
    if (!targetNormalized) return [];

    // Az összes előfordulás ezzel a normalizált névvel
    const items: OccurrenceItem[] = [];
    for (const cls of viewData.classes) {
      for (const t of cls.teachers) {
        if (t.normalizedName === targetNormalized) {
          items.push({
            personId: t.personId,
            projectId: cls.projectId,
            name: t.name,
            className: cls.className,
            schoolName: cls.schoolName,
            hasPhoto: t.hasPhoto,
            photoThumbUrl: t.photoThumbUrl,
          });
        }
      }
    }
    return items;
  });

  readonly teacherName = computed(() => {
    const items = this.occurrences();
    return items.length > 0 ? items[0].name : '';
  });

  readonly hasNameVariants = computed(() => {
    const items = this.occurrences();
    const names = new Set(items.map(i => i.name));
    return names.size > 1;
  });

  readonly archiveMatch = computed(() => {
    const viewData = this.dataService.data();
    const items = this.occurrences();
    if (!viewData || items.length === 0) return null;

    const targetPerson = items[0];
    return viewData.archive.teachers.find(t =>
      t.name.toLowerCase().trim() === targetPerson.name.toLowerCase().trim()
    ) ?? null;
  });

  onClose(): void {
    this.close.emit();
  }
}
