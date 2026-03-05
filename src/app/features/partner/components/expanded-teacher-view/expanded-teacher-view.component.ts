import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from './expanded-teacher-view-data.service';
import { ExpandedUploadPanelComponent } from './expanded-upload-panel/expanded-upload-panel.component';
import { ExpandedClassColumnComponent } from './expanded-class-column/expanded-class-column.component';
import { ExpandedTeacherPopupComponent } from './expanded-teacher-popup/expanded-teacher-popup.component';
import { ExpandedProjectInfo } from './expanded-teacher-view.types';
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({
  selector: 'app-expanded-teacher-view',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ExpandedUploadPanelComponent,
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

  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly teacherUpdated = output<void>();

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly loading = computed(() => this.dataService.loading());
  readonly projects = computed(() => this.dataService.projects());
  readonly classes = computed(() => this.dataService.classes());
  readonly availableProjects = computed(() => this.dataService.availableProjects());
  readonly selectedPersonId = computed(() => this.dataService.selectedPersonId());
  readonly similarityGroups = computed(() => this.dataService.similarityGroups());

  showDropdown = false;
  dropdownSearch = signal('');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('dropdownSearchInput');

  // Projektek csoportosítása: same school előre
  readonly groupedAvailableProjects = computed(() => {
    const projects = this.availableProjects();
    const query = this.dropdownSearch().trim().toLowerCase();
    let filtered = projects;
    if (query) {
      filtered = projects.filter(p =>
        p.schoolName.toLowerCase().includes(query) ||
        p.className.toLowerCase().includes(query)
      );
    }
    const sameSchool = filtered.filter(p => p.sameSchool);
    const otherSchool = filtered.filter(p => !p.sameSchool);
    return { sameSchool, otherSchool };
  });

  readonly hasSimilarityIssues = computed(() => this.similarityGroups().length > 0);

  ngOnInit(): void {
    this.dataService.loadData(this.projectId());
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDropdown) {
      this.showDropdown = false;
      this.dropdownSearch.set('');
    } else if (this.selectedPersonId()) {
      this.dataService.onTeacherSelect(null);
    } else {
      this.close.emit();
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showDropdown) {
      this.showDropdown = false;
      this.dropdownSearch.set('');
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    this.dropdownSearch.set('');
    if (this.showDropdown) {
      setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
    }
  }

  addProject(project: ExpandedProjectInfo): void {
    this.dataService.addProject(project.projectId);
    this.showDropdown = false;
    this.dropdownSearch.set('');
  }

  removeProject(projectId: number): void {
    this.dataService.removeProject(projectId);
  }

  closePopup(): void {
    this.dataService.onTeacherSelect(null);
  }
}
