import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';

@Component({
  selector: 'app-expanded-archive-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, FormsModule],
  templateUrl: './expanded-archive-panel.component.html',
  styleUrl: './expanded-archive-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedArchivePanelComponent {
  readonly ICONS = ICONS;
  readonly dataService = inject(ExpandedTeacherViewDataService);

  readonly uploadRequested = output<void>();
  readonly syncRequested = output<void>();

  readonly archiveData = computed(() => this.dataService.data()?.archive);
  readonly filteredTeachers = computed(() => this.dataService.filteredArchiveTeachers());
  readonly collapsed = computed(() => this.dataService.archiveCollapsed());

  readonly summaryText = computed(() => {
    const data = this.archiveData();
    if (!data) return '';
    return `${data.totalCount} tanár | ${data.withPhotoCount} fotóval | ${data.missingPhotoCount} hiányzó`;
  });

  toggleCollapse(): void {
    this.dataService.archiveCollapsed.update(v => !v);
  }

  onSearchChange(value: string): void {
    this.dataService.archiveSearchQuery.set(value);
  }

  onMissingPhotoToggle(): void {
    this.dataService.showOnlyMissingPhoto.update(v => !v);
  }
}
