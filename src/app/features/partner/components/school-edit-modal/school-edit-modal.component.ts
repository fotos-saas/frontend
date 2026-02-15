import { Component, input, output, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, SchoolListItem, SchoolItem } from '../../services/partner.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsInputComponent } from '../../../../shared/components/form/ps-input/ps-input.component';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

/**
 * School Edit Modal - Iskola szerkesztése.
 */
@Component({
  selector: 'app-school-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      [variant]="mode() === 'create' ? 'create' : 'edit'"
      headerStyle="flat"
      theme="blue"
      [icon]="ICONS.BUILDING_2"
      [title]="mode() === 'create' ? 'Új iskola' : 'Iskola szerkesztése'"
      size="md"
      [closable]="!saving()"
      [isSubmitting]="saving()"
      [errorMessage]="errorMessage()"
      (closeEvent)="close.emit()"
      (submitEvent)="save()"
    >
      <ng-container dialogBody>
        <ps-input
          label="Iskola neve"
          [required]="true"
          [(ngModel)]="name"
          name="name"
          placeholder="Pl. Bolyai János Gimnázium"
        />

        <ps-input
          label="Város"
          [(ngModel)]="city"
          name="city"
          placeholder="Pl. Budapest"
        />
      </ng-container>

      <ng-container dialogFooter>
        <button type="button" class="btn btn--outline" (click)="close.emit()" [disabled]="saving()">
          Mégse
        </button>
        <button
          type="button"
          class="btn btn--primary"
          (click)="save()"
          [disabled]="saving() || !name.trim()"
        >
          @if (saving()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
            Mentés...
          } @else {
            <lucide-icon [name]="ICONS.CHECK" [size]="16" />
            {{ mode() === 'create' ? 'Létrehozás' : 'Mentés' }}
          }
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolEditModalComponent {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly school = input<SchoolListItem | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly close = output<void>();
  readonly saved = output<SchoolItem>();

  readonly ICONS = ICONS;

  name = '';
  city = '';
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const school = this.school();
    if (school && this.mode() === 'edit') {
      this.name = school.name;
      this.city = school.city ?? '';
    }
  }

  save(): void {
    if (!this.name.trim() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.name.trim(),
      city: this.city.trim() || null
    };

    const request$ = this.mode() === 'create'
      ? this.partnerService.createSchool(payload)
      : this.partnerService.updateSchool(this.school()!.id, payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.saved.emit(response.data);
        } else {
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      }
    });
  }
}
