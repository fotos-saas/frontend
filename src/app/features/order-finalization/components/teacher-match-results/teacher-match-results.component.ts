import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import {
  TeacherMatchResult,
  TeacherResolution
} from '../../models/order-finalization.models';

@Component({
  selector: 'app-teacher-match-results',
  templateUrl: './teacher-match-results.component.html',
  styleUrls: ['./teacher-match-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule]
})
export class TeacherMatchResultsComponent {
  readonly ICONS = ICONS;

  matchResults = input.required<TeacherMatchResult[]>();
  resolutions = input.required<TeacherResolution[]>();
  loading = input<boolean>(false);

  resolutionsChange = output<TeacherResolution[]>();

  matchedResults = computed(() =>
    this.matchResults().filter(r => r.matchType !== 'no_match' && r.teacherId)
  );

  unmatchedResults = computed(() =>
    this.matchResults().filter(r => r.matchType === 'no_match' || !r.teacherId)
  );

  getResolution(inputName: string): TeacherResolution | undefined {
    return this.resolutions().find(r => r.inputName === inputName);
  }

  setResolution(inputName: string, teacherId: number | null, resolution: TeacherResolution['resolution']): void {
    const current = [...this.resolutions()];
    const idx = current.findIndex(r => r.inputName === inputName);
    const entry: TeacherResolution = { inputName, teacherId, resolution };

    if (idx >= 0) {
      current[idx] = entry;
    } else {
      current.push(entry);
    }

    this.resolutionsChange.emit(current);
  }

  isResolution(inputName: string, resolution: TeacherResolution['resolution']): boolean {
    const r = this.getResolution(inputName);
    return r?.resolution === resolution;
  }
}
