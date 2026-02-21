import {
  Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { SessionType, SessionTypeTemplate, LOCATION_TYPE_LABELS } from '../../../models/booking.models';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SessionTypeFormComponent } from './session-type-form.component';

@Component({
  selector: 'app-session-types',
  standalone: true,
  imports: [FormsModule, DecimalPipe, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent, SessionTypeFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-types.component.html',
  styleUrl: './session-types.component.scss',
})
export class SessionTypesComponent implements OnInit {
  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly LOCATION_TYPE_LABELS = LOCATION_TYPE_LABELS;

  sessionTypes = signal<SessionType[]>([]);
  templates = signal<SessionTypeTemplate[]>([]);
  loading = signal(true);
  showTemplates = signal(false);
  editingType = signal<SessionType | null | undefined>(undefined);
  deletingType = signal<SessionType | null>(null);

  private templateBackdropDown = false;

  ngOnInit(): void { this.loadSessionTypes(); }

  loadSessionTypes(): void {
    this.loading.set(true);
    this.bookingService.getSessionTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => { this.sessionTypes.set(res.data?.session_types ?? res.data ?? []); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  openForm(): void { this.editingType.set(null); }
  editType(type: SessionType): void { this.editingType.set(type); }

  onTypeSaved(): void {
    this.editingType.set(undefined);
    this.loadSessionTypes();
  }

  confirmDelete(type: SessionType): void { this.deletingType.set(type); }

  deleteType(): void {
    const type = this.deletingType();
    if (!type) return;
    this.bookingService.deleteSessionType(type.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.deletingType.set(null); this.loadSessionTypes(); }, error: () => this.deletingType.set(null) });
  }

  onTemplateBackdropDown(e: MouseEvent): void {
    this.templateBackdropDown = (e.target as HTMLElement).classList.contains('dialog-backdrop');
  }

  onTemplateBackdropClick(e: MouseEvent): void {
    if (this.templateBackdropDown && (e.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.showTemplates.set(false);
    }
    this.templateBackdropDown = false;
  }

  useTemplate(key: string): void {
    this.bookingService.createFromTemplate(key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.showTemplates.set(false); this.loadSessionTypes(); } });
  }

  loadTemplates(): void {
    if (this.templates().length > 0) return;
    this.bookingService.getSessionTypeTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.templates.set(res.data) });
  }
}
