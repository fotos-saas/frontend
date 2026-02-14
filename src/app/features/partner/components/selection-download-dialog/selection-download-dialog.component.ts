import { Component, ChangeDetectionStrategy, output, signal, input, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

export type SelectionPersonType = 'student' | 'teacher' | 'both';
export type SelectionFileNaming = 'original' | 'student_name';
export type SelectionDialogMode = 'project' | 'school';

export interface SelectionDownloadResult {
  personType: SelectionPersonType;
  fileNaming: SelectionFileNaming;
  allProjects: boolean;
}

@Component({
  selector: 'app-selection-download-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './selection-download-dialog.component.html',
  styleUrl: './selection-download-dialog.component.scss',
})
export class SelectionDownloadDialogComponent {
  /** 'project' = személytípus + fájlnév, 'school' = hatókör + fájlnév (tanárok fix) */
  readonly mode = input<SelectionDialogMode>('project');

  readonly download = output<SelectionDownloadResult>();
  readonly close = output<void>();

  readonly ICONS = ICONS;
  readonly selectedType = signal<SelectionPersonType>('both');
  readonly selectedNaming = signal<SelectionFileNaming>('student_name');
  readonly allProjects = signal(false);

  /** Aktuális tanév: szept-től új tanév (pl. "2025-2026") */
  readonly currentSchoolYear = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startYear = now.getMonth() >= 8 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  });

  selectType(type: SelectionPersonType): void {
    this.selectedType.set(type);
  }

  selectNaming(naming: SelectionFileNaming): void {
    this.selectedNaming.set(naming);
  }

  onSubmit(): void {
    this.download.emit({
      personType: this.mode() === 'school' ? 'teacher' : this.selectedType(),
      fileNaming: this.selectedNaming(),
      allProjects: this.allProjects(),
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
