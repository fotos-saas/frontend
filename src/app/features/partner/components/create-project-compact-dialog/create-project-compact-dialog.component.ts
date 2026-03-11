import {
  Component,
  ChangeDetectionStrategy,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PsInputComponent, PsTextareaComponent, PsAutocompleteComponent } from '@shared/components/form';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PartnerService, PartnerProjectListItem, SchoolItem } from '../../services/partner.service';
import { OrderValidationService } from '../../../order-finalization/services/order-validation.service';
import { AddSchoolModalComponent } from '../add-school-modal/add-school-modal.component';

@Component({
  selector: 'app-create-project-compact-dialog',
  templateUrl: './create-project-compact-dialog.component.html',
  styleUrls: ['./create-project-compact-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    NgxEditorModule,
    DialogWrapperComponent,
    PsInputComponent,
    PsTextareaComponent,
    PsAutocompleteComponent,
    AddSchoolModalComponent,
  ],
})
export class CreateProjectCompactDialogComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly validation = inject(OrderValidationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = output<void>();
  readonly projectCreated = output<PartnerProjectListItem>();

  readonly ICONS = ICONS;

  /** Form adatok */
  schoolName = signal('');
  className = signal('');
  classYear = signal('');
  contactName = signal('');
  contactEmail = signal('');

  /** Opcionális mezők */
  city = signal('');
  quote = signal('');
  contactPhone = signal('');

  /** Design mezők */
  fontFamily = signal('');
  fontColor = signal('#000000');
  description = signal('');

  /** Collapse szekciók */
  showExtra = signal(false);
  showDesign = signal(false);

  /** UI állapotok */
  submitting = signal(false);
  showAddSchoolModal = signal(false);

  /** Iskola autocomplete */
  schoolSuggestions = signal<PsSelectOption[]>([]);
  schoolLoading = signal(false);
  private readonly schoolSearch$ = new Subject<string>();

  /** Rich text editor */
  editor!: Editor;
  editorToolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['bullet_list', 'ordered_list'],
  ];

  /** Validáció */
  isValid = computed(() => {
    const contact = { name: this.contactName(), email: this.contactEmail(), phone: this.contactPhone() };
    const basicInfo = { schoolName: this.schoolName(), city: this.city(), className: this.className(), classYear: this.classYear(), quote: this.quote() };
    return this.validation.isContactDataValidForPartner(contact)
      && this.validation.isBasicInfoValidForPartner(basicInfo);
  });

  ngOnInit(): void {
    this.editor = new Editor();
    this.destroyRef.onDestroy(() => this.editor.destroy());

    this.schoolSearch$.pipe(
      debounceTime(300),
      switchMap(query => {
        this.schoolLoading.set(true);
        return this.partnerService.getAllSchools(query).pipe(
          catchError(() => of([] as SchoolItem[]))
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(schools => {
      this.schoolSuggestions.set(
        schools.map(s => ({ id: s.id, label: s.name, sublabel: s.city || undefined }))
      );
      this.schoolLoading.set(false);
    });
  }

  // --- Iskola keresés ---

  onSchoolSearch(query: string): void {
    this.schoolSearch$.next(query);
  }

  onSchoolSelected(option: PsSelectOption): void {
    this.schoolName.set(option.label);
    if (option.sublabel) {
      this.city.set(option.sublabel);
    }
  }

  openAddSchoolModal(): void {
    this.showAddSchoolModal.set(true);
  }

  closeAddSchoolModal(): void {
    this.showAddSchoolModal.set(false);
  }

  onSchoolCreated(school: SchoolItem): void {
    this.closeAddSchoolModal();
    this.schoolName.set(school.name);
    if (school.city) {
      this.city.set(school.city);
    }
    this.toast.success('Siker', `"${school.name}" iskola hozzáadva!`);
  }

  onColorInput(event: Event): void {
    this.fontColor.set((event.target as HTMLInputElement).value);
  }

  // --- Description ---

  updateDescription(value: string): void {
    if (value && value.length > 5000) {
      this.toast.error('Túl hosszú', 'A leírás maximum 5000 karakter lehet');
      return;
    }
    this.description.set(value);
  }

  // --- Submit ---

  submit(): void {
    if (!this.isValid() || this.submitting()) return;

    this.submitting.set(true);

    this.partnerService.createProjectWithWizard({
      contact_name: this.contactName(),
      contact_email: this.contactEmail(),
      contact_phone: this.contactPhone() || undefined,
      school_name: this.schoolName(),
      city: this.city() || undefined,
      class_name: this.className(),
      class_year: this.classYear(),
      quote: this.quote() || undefined,
      font_family: this.fontFamily() || undefined,
      font_color: this.fontColor() !== '#000000' ? this.fontColor() : undefined,
      description: this.description() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('Siker', 'Projekt sikeresen létrehozva!');
            this.projectCreated.emit(response.data);
            this.close.emit();
          } else {
            this.submitting.set(false);
            this.toast.error('Hiba', response.message || 'Hiba történt a projekt létrehozása során.');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          const msg = err.error?.message || 'Hiba történt a projekt létrehozása során.';
          this.toast.error('Hiba', msg);
          this.logger.error('Compact project creation failed', err);
        },
      });
  }
}
