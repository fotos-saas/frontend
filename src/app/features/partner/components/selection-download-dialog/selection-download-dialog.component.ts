import { Component, ChangeDetectionStrategy, output, signal, input, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsRadioGroupComponent } from '@shared/components/form';
import { PsRadioOption } from '@shared/components/form/form.types';

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
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsRadioGroupComponent],
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

  readonly personTypeOptions: PsRadioOption[] = [
    { value: 'student', label: 'Diákok' },
    { value: 'teacher', label: 'Tanárok' },
    { value: 'both', label: 'Mindkettő' },
  ];

  readonly fileNamingOptions: PsRadioOption[] = [
    { value: 'student_name', label: 'Elnevezett', sublabel: 'Személy neve a fájlnévben (pl. Kiss Péter.jpg)' },
    { value: 'original', label: 'Eredeti fájlnév', sublabel: 'A feltöltéskori fájlnév (pl. IMG_1234.jpg)' },
  ];

  /** Aktuális tanév: szept-től új tanév (pl. "2025-2026") */
  readonly currentSchoolYear = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startYear = now.getMonth() >= 8 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  });

  readonly scopeOptions = computed<PsRadioOption[]>(() => [
    { value: 'current', label: 'Aktuális tanárok', sublabel: `A jelenleg aktív tanárok fotói (${this.currentSchoolYear()})` },
    { value: 'all', label: 'Összes évfolyam', sublabel: 'Minden projekt tanárai, évfolyamonként mappázva' },
  ]);

  /** Signal wrapper: scope radio value → allProjects boolean */
  readonly scopeValue = computed(() => this.allProjects() ? 'all' : 'current');

  onScopeChange(value: string | number): void {
    this.allProjects.set(value === 'all');
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
