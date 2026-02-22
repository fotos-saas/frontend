import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerOrderSyncService } from '../../services/partner-order-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import {
  OrderSyncData,
  ParsedStudent,
  ParsedTeacher,
} from '../../models/order-sync.models';

@Component({
  selector: 'app-order-sync-panel',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule],
  templateUrl: './order-sync-panel.component.html',
  styleUrls: ['./order-sync-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSyncPanelComponent {
  readonly ICONS = ICONS;
  readonly projectId = input.required<number>();

  syncData = signal<OrderSyncData | null>(null);
  loading = signal(true);
  reparsing = signal(false);
  saving = signal(false);
  editing = signal(false);

  // Szerkeszthető névsorok
  editStudents: { name: string; note: string }[] = [];
  editTeachers: { name: string; title: string }[] = [];

  private destroyRef = inject(DestroyRef);
  private syncService = inject(PartnerOrderSyncService);
  private cdr = inject(ChangeDetectorRef);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);

  ngOnInit(): void {
    this.loadSyncStatus();
  }

  loadSyncStatus(): void {
    this.loading.set(true);
    this.syncService.getOrderSyncStatus(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.syncData.set(res.data);
          }
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading.set(false);
          this.cdr.markForCheck();
          this.logger.error('Order sync load error', err);
        },
      });
  }

  reparse(): void {
    if (this.reparsing()) return;
    this.reparsing.set(true);

    this.syncService.reparseNames(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Kész', 'Névsor újrafeldolgozva');
          this.reparsing.set(false);
          this.loadSyncStatus();
        },
        error: (err) => {
          this.toast.error('Hiba', 'Nem sikerült újrafeldolgozni');
          this.reparsing.set(false);
          this.cdr.markForCheck();
          this.logger.error('Reparse error', err);
        },
      });
  }

  startEditing(): void {
    const data = this.syncData();
    if (!data) return;

    this.editStudents = data.parsedStudents.map(s => ({ name: s.name, note: s.note }));
    this.editTeachers = data.parsedTeachers.map(t => ({ name: t.name, title: t.title }));
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  addStudent(): void {
    this.editStudents.push({ name: '', note: '' });
  }

  removeStudent(index: number): void {
    this.editStudents.splice(index, 1);
  }

  addTeacher(): void {
    this.editTeachers.push({ name: '', title: '' });
  }

  removeTeacher(index: number): void {
    this.editTeachers.splice(index, 1);
  }

  saveRoster(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const students = this.editStudents.filter(s => s.name.trim());
    const teachers = this.editTeachers.filter(t => t.name.trim());

    this.syncService.updateRoster(this.projectId(), { students, teachers })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Mentve', 'Névsor frissítve');
          this.saving.set(false);
          this.editing.set(false);
          this.loadSyncStatus();
        },
        error: (err) => {
          this.toast.error('Hiba', 'Nem sikerült menteni');
          this.saving.set(false);
          this.cdr.markForCheck();
          this.logger.error('Save roster error', err);
        },
      });
  }

  getStatusColor(status: string | null): string {
    switch (status) {
      case 'synced': return 'green';
      case 'needs_review': return 'amber';
      case 'failed': return 'red';
      case 'pending': return 'blue';
      default: return 'slate';
    }
  }

  getStatusLabel(status: string | null): string {
    switch (status) {
      case 'synced': return 'Szinkronizálva';
      case 'needs_review': return 'Felülvizsgálat szükséges';
      case 'failed': return 'Sikertelen';
      case 'pending': return 'Folyamatban';
      default: return 'Nincs szinkronizálva';
    }
  }

  getMatchIcon(matchType: string | null): string {
    switch (matchType) {
      case 'exact': return ICONS.CHECK_CIRCLE;
      case 'fuzzy': return ICONS.ALERT_TRIANGLE;
      case 'ai':
      case 'ai_sonnet': return ICONS.SPARKLES;
      case 'no_match': return ICONS.X_CIRCLE;
      default: return ICONS.HELP_CIRCLE;
    }
  }

  getMatchLabel(matchType: string | null): string {
    switch (matchType) {
      case 'exact': return 'Pontos egyezés';
      case 'fuzzy': return 'Hasonló név';
      case 'ai':
      case 'ai_sonnet': return 'AI párosítás';
      case 'no_match': return 'Nincs egyezés';
      default: return 'Nem párosított';
    }
  }

  getWarningLabel(warning: string): string {
    switch (warning) {
      case 'ai_fallback_used': return 'AI hiba, fallback feldolgozás';
      case 'count_mismatch': return 'Létszám eltérés az eredeti és a feldolgozott között';
      case 'unusual_format': return 'Szokatlan névsor formátum (nem soronként 1 név)';
      case 'empty_roster': return 'Üres névsor';
      case 'api_unavailable': return 'API nem elérhető';
      default: return warning;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackById(index: number, item: ParsedStudent | ParsedTeacher): number {
    return item.id;
  }
}
