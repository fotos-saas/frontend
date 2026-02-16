import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, of, catchError, filter, distinctUntilChanged } from 'rxjs';
import { PsSelectComponent, PsTextareaComponent, PsCheckboxComponent, PsSelectOption } from '@shared/components/form';
import {
  RosterData,
  SortType,
  SORT_TYPE_OPTIONS,
  TeacherMatchResult,
  TeacherResolution
} from '../../../models/order-finalization.models';
import { OrderValidationService, ValidationError } from '../../../services/order-validation.service';
import { TeacherMatchService } from '../../../services/teacher-match.service';
import { TeacherMatchResultsComponent } from '../../teacher-match-results/teacher-match-results.component';

@Component({
  selector: 'app-roster-step',
  templateUrl: './roster-step.component.html',
  styleUrls: ['./roster-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, TeacherMatchResultsComponent, PsSelectComponent, PsTextareaComponent, PsCheckboxComponent]
})
export class RosterStepComponent {
  private readonly validationService = inject(OrderValidationService);
  private readonly teacherMatchService = inject(TeacherMatchService);
  private readonly destroyRef = inject(DestroyRef);

  data = input.required<RosterData>();
  partnerMode = input<boolean>(false);
  dataChange = output<RosterData>();

  readonly sortTypeOptions = SORT_TYPE_OPTIONS;

  /** PsSelectOption formátumra mappolt opciók */
  readonly selectOptions: PsSelectOption[] = SORT_TYPE_OPTIONS.map(o => ({
    id: o.value,
    label: o.label
  }));

  /** AI matching állapot */
  matchResults = signal<TeacherMatchResult[]>([]);
  matchLoading = signal(false);
  teacherResolutions = signal<TeacherResolution[]>([]);

  private readonly teacherNames$ = new Subject<string>();

  errors = computed<ValidationError[]>(() => {
    const result = this.partnerMode()
      ? this.validationService.validateRosterDataPartner(this.data())
      : this.validationService.validateRosterData(this.data());
    return result.errors;
  });

  touched: Record<string, boolean> = {
    studentRoster: false,
    teacherRoster: false,
    sortType: false,
    acceptTerms: false
  };

  constructor() {
    this.setupTeacherMatching();
  }

  updateField<K extends keyof RosterData>(field: K, value: RosterData[K]): void {
    this.touched[field as string] = true;
    this.dataChange.emit({ ...this.data(), [field]: value });
  }

  updateSortType(value: string): void {
    this.touched['sortType'] = true;
    this.dataChange.emit({ ...this.data(), sortType: value as SortType });
  }

  updateAcceptTerms(value: boolean): void {
    this.touched['acceptTerms'] = true;
    this.dataChange.emit({ ...this.data(), acceptTerms: value });
  }

  getFieldError(field: string): string | null {
    if (!this.touched[field]) return null;
    return this.validationService.getFieldError(this.errors(), field);
  }

  hasError(field: string): boolean {
    return !!this.getFieldError(field);
  }

  studentCount = computed<number>(() => {
    const roster = this.data().studentRoster;
    if (!roster || !roster.trim()) return 0;
    return roster.split('\n').filter(line => line.trim()).length;
  });

  teacherCount = computed<number>(() => {
    const roster = this.data().teacherRoster;
    if (!roster || !roster.trim()) return 0;
    return roster.split('\n').filter(line => line.trim()).length;
  });

  /** Tanár textarea blur → AI matching trigger */
  onTeacherBlur(): void {
    this.touched['teacherRoster'] = true;
    const text = this.data().teacherRoster;
    if (text?.trim()) {
      this.teacherNames$.next(text);
    }
  }

  /** Resolutions frissítés a child komponensből */
  onResolutionsChange(resolutions: TeacherResolution[]): void {
    this.teacherResolutions.set(resolutions);
    this.dataChange.emit({
      ...this.data(),
      teacherResolutions: resolutions
    });
  }

  private setupTeacherMatching(): void {
    this.teacherNames$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(text => {
        const names = text.split('\n').map(n => n.trim()).filter(n => n);
        return names.length > 0 && names.length <= 20;
      }),
      switchMap(text => {
        const names = text.split('\n').map(n => n.trim()).filter(n => n);
        this.matchLoading.set(true);
        this.matchResults.set([]);

        return this.teacherMatchService.matchTeacherNames(names).pipe(
          catchError(() => {
            this.matchLoading.set(false);
            return of([]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      this.matchLoading.set(false);
      this.matchResults.set(results);

      // Automatikus resolutions a matched eredményekhez
      const autoResolutions: TeacherResolution[] = results
        .filter(r => r.matchType !== 'no_match' && r.teacherId)
        .map(r => ({
          inputName: r.inputName,
          teacherId: r.teacherId,
          resolution: 'matched' as const
        }));

      // Meglévő manuális resolutions megtartása
      const currentResolutions = this.teacherResolutions();
      const manualResolutions = currentResolutions.filter(
        cr => !autoResolutions.some(ar => ar.inputName === cr.inputName)
      );

      const merged = [...autoResolutions, ...manualResolutions];
      this.teacherResolutions.set(merged);
      this.dataChange.emit({
        ...this.data(),
        teacherResolutions: merged
      });
    });
  }
}
