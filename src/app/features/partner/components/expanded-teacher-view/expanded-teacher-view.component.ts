import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from './expanded-teacher-view-data.service';
import { ExpandedArchivePanelComponent } from './expanded-archive-panel/expanded-archive-panel.component';
import { ExpandedClassColumnComponent } from './expanded-class-column/expanded-class-column.component';
import { ExpandedTeacherPopupComponent } from './expanded-teacher-popup/expanded-teacher-popup.component';
import { ExpandedSchoolInfo } from './expanded-teacher-view.types';
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({
  selector: 'app-expanded-teacher-view',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    ExpandedArchivePanelComponent,
    ExpandedClassColumnComponent,
    ExpandedTeacherPopupComponent,
  ],
  providers: [ExpandedTeacherViewDataService],
  templateUrl: './expanded-teacher-view.component.html',
  styleUrl: './expanded-teacher-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedTeacherViewComponent implements OnInit {
  readonly ICONS = ICONS;
  readonly dataService = inject(ExpandedTeacherViewDataService);

  readonly schoolId = input.required<number>();
  readonly classYear = input<string>();
  readonly projectId = input<number>();

  readonly close = output<void>();
  readonly teacherUpdated = output<void>();

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly loading = computed(() => this.dataService.loading());
  readonly schools = computed(() => this.dataService.schools());
  readonly classes = computed(() => this.dataService.classes());
  readonly availableSchools = computed(() => this.dataService.availableSchools());
  readonly selectedPersonId = computed(() => this.dataService.selectedPersonId());
  readonly similarityGroups = computed(() => this.dataService.similarityGroups());

  showDropdown = false;

  readonly hasSimilarityIssues = computed(() => this.similarityGroups().length > 0);

  ngOnInit(): void {
    this.dataService.loadData(this.schoolId(), this.classYear());
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedPersonId()) {
      this.dataService.onTeacherSelect(null);
    } else {
      this.close.emit();
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  addSchool(school: ExpandedSchoolInfo): void {
    this.dataService.addSchool(school.id);
    this.showDropdown = false;
    this.dataService.loadData(this.schoolId(), this.classYear());
  }

  removeSchool(schoolId: number): void {
    this.dataService.removeSchool(schoolId);
    this.dataService.loadData(this.schoolId(), this.classYear());
  }

  closePopup(): void {
    this.dataService.onTeacherSelect(null);
  }

  onUploadRequested(): void {
    // Meglévő archive bulk photo upload dialog hívása — a szülő kezelné
    this.teacherUpdated.emit();
  }

  onSyncRequested(): void {
    // Meglévő sync preview/execute flow — a szülő kezelné
    this.teacherUpdated.emit();
  }
}
