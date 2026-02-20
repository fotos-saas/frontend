import {
  Component,
  inject,
  signal,
  computed,
  output,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
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
  PREPAYMENT_MODE_LABELS,
} from '../../../models/prepayment.models';
import {
  PsInputComponent,
  PsTextareaComponent,
  PsToggleComponent,
  PsSelectComponent,
} from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';

interface ClassGroup {
  name: string;
  persons: { id: number; name: string; guest_session_id?: number }[];
  selected: boolean;
}

@Component({
  selector: 'app-bulk-prepayment-dialog',
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
  ],
  templateUrl: './bulk-prepayment-dialog.component.html',
  styleUrl: './bulk-prepayment-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkPrepaymentDialogComponent implements OnInit {
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly MODE_LABELS = PREPAYMENT_MODE_LABELS;

  // Listák
  projects = signal<PsSelectOption[]>([]);
  selectedProjectId = signal<number | null>(null);
  classGroups = signal<ClassGroup[]>([]);

  // Konfiguráció
  effectiveConfig = signal<PrepaymentConfig | null>(null);
  packages = signal<PrepaymentPackage[]>([]);

  // Űrlap
  selectedPackageKey = signal('');
  amountOverride = signal<number | null>(null);
  sendLinks = signal(true);
  paymentDeadlineDays = signal(7);
  notes = signal('');

  // Állapot
  loadingClasses = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly totalSelected = computed(() => {
    return this.classGroups()
      .filter((g) => g.selected)
      .reduce((sum, g) => sum + g.persons.length, 0);
  });

  readonly summaryText = computed(() => {
    const selected = this.classGroups().filter((g) => g.selected);
    if (selected.length === 0) return 'Nincs kiválasztva osztály.';
    const count = this.totalSelected();
    return `${selected.length} osztály, ${count} diák kerül kiválasztásra.`;
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.projectService.getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const list = res.data ?? res;
          this.projects.set(list.map((p: any) => ({ id: p.id, label: p.name })));
        },
      });
  }

  onProjectChange(projectId: number | string): void {
    const id = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    this.selectedProjectId.set(id);
    this.loadClasses(id);
    this.loadEffectiveConfig(id);
  }

  private loadClasses(projectId: number): void {
    this.loadingClasses.set(true);
    this.projectService.getProjectPersons(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const persons = res.data ?? res;
          const grouped = new Map<string, ClassGroup>();
          for (const p of persons) {
            const className = p.class_name || 'Osztály nélkül';
            if (!grouped.has(className)) {
              grouped.set(className, { name: className, persons: [], selected: true });
            }
            grouped.get(className)!.persons.push({
              id: p.id,
              name: p.name,
              guest_session_id: p.guest_session_id,
            });
          }
          this.classGroups.set(Array.from(grouped.values()));
          this.loadingClasses.set(false);
        },
        error: () => this.loadingClasses.set(false),
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

  toggleClass(index: number): void {
    const groups = [...this.classGroups()];
    groups[index] = { ...groups[index], selected: !groups[index].selected };
    this.classGroups.set(groups);
  }

  selectAllClasses(): void {
    this.classGroups.set(this.classGroups().map((g) => ({ ...g, selected: true })));
  }

  deselectAllClasses(): void {
    this.classGroups.set(this.classGroups().map((g) => ({ ...g, selected: false })));
  }

  onSubmit(): void {
    const projectId = this.selectedProjectId();
    if (!projectId || this.totalSelected() === 0) {
      this.errorMessage.set('Válassz projektet és legalább egy osztályt.');
      return;
    }

    const entries = this.classGroups()
      .filter((g) => g.selected)
      .flatMap((g) =>
        g.persons.map((p) => ({
          person_id: p.id,
          guest_session_id: p.guest_session_id,
        }))
      );

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.prepaymentService.bulkCreate({
      project_id: projectId,
      entries,
      package_key: this.selectedPackageKey() || undefined,
      send_payment_links: this.sendLinks(),
      payment_deadline_days: this.paymentDeadlineDays(),
      amount_huf: this.amountOverride() ?? undefined,
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
