import {
  Component,
  inject,
  signal,
  DestroyRef,
  ChangeDetectionStrategy,
  output,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import {
  PrepaymentConfig,
  PrepaymentPackage,
} from '../../../models/prepayment.models';
import {
  PsInputComponent,
  PsTextareaComponent,
  PsToggleComponent,
  PsSelectComponent,
  PsMultiSelectBoxComponent,
} from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';

interface PersonOption {
  id: number;
  name: string;
  class_name: string | null;
}

@Component({
  selector: 'app-create-prepayment-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    LucideAngularModule,
    DialogWrapperComponent,
    PsInputComponent,
    PsTextareaComponent,
    PsToggleComponent,
    PsSelectComponent,
    PsMultiSelectBoxComponent,
  ],
  templateUrl: './create-prepayment-dialog.component.html',
  styleUrl: './create-prepayment-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePrepaymentDialogComponent implements OnInit {
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // Kiválasztás
  projects = signal<PsSelectOption[]>([]);
  selectedProjectId = signal<number | null>(null);
  persons = signal<PersonOption[]>([]);
  selectedPersonIds = signal<number[]>([]);

  // Konfiguráció
  effectiveConfig = signal<PrepaymentConfig | null>(null);
  packages = signal<PrepaymentPackage[]>([]);

  // Űrlap
  amountOverride = signal<number | null>(null);
  selectedPackageKey = signal('');
  deadline = signal('');
  sendPaymentLink = signal(true);
  notes = signal('');

  // Állapot
  loadingPersons = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const list = res.data ?? res;
          this.projects.set(
            list.map((p: any) => ({ id: p.id, label: p.name }))
          );
        },
      });
  }

  onProjectChange(projectId: number | string): void {
    const id = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    this.selectedProjectId.set(id);
    this.selectedPersonIds.set([]);
    this.loadPersons(id);
    this.loadEffectiveConfig(id);
  }

  private loadPersons(projectId: number): void {
    this.loadingPersons.set(true);
    // A PersonService-t használjuk a project személyeinek betöltésére
    this.projectService.getProjectPersons(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const list = res.data ?? res;
          this.persons.set(list.map((p: any) => ({
            id: p.id,
            name: p.name,
            class_name: p.class_name ?? null,
          })));
          this.loadingPersons.set(false);
        },
        error: () => this.loadingPersons.set(false),
      });
  }

  private loadEffectiveConfig(projectId: number): void {
    this.prepaymentService.getEffectiveConfig(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.effectiveConfig.set(res.data);
          this.packages.set(res.data?.packages ?? []);
        },
      });
  }

  togglePerson(personId: number): void {
    const current = this.selectedPersonIds();
    if (current.includes(personId)) {
      this.selectedPersonIds.set(current.filter((id) => id !== personId));
    } else {
      this.selectedPersonIds.set([...current, personId]);
    }
  }

  selectAllPersons(): void {
    this.selectedPersonIds.set(this.persons().map((p) => p.id));
  }

  deselectAllPersons(): void {
    this.selectedPersonIds.set([]);
  }

  isPersonSelected(personId: number): boolean {
    return this.selectedPersonIds().includes(personId);
  }

  onSubmit(): void {
    const projectId = this.selectedProjectId();
    const personIds = this.selectedPersonIds();

    if (!projectId || personIds.length === 0) {
      this.errorMessage.set('Válassz projektet és legalább egy diákot.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.prepaymentService.createPrepayments({
      project_id: projectId,
      person_ids: personIds,
      amount_huf: this.amountOverride() ?? undefined,
      package_key: this.selectedPackageKey() || undefined,
      deadline: this.deadline() || undefined,
      send_payment_link: this.sendPaymentLink(),
      notes: this.notes() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'Hiba történt a létrehozás során.');
        },
      });
  }
}
