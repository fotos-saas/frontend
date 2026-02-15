import { Component, ChangeDetectionStrategy, input, signal, inject, DestroyRef, OnInit, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { InfoBoxComponent } from '../../../components/info-box';
import { PartnerService, GuestSession, PaginatedResponse } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DevLoginService } from '../../../../core/services/dev-login.service';
import { GuestSessionEditDialogComponent } from '../guest-session-edit-dialog/guest-session-edit-dialog.component';

@Component({
  selector: 'app-project-users-tab',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, MatTooltipModule, PsSelectComponent, InfoBoxComponent, GuestSessionEditDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-users-tab.component.html',
  styleUrl: './project-users-tab.component.scss',
})
export class ProjectUsersTabComponent implements OnInit {
  projectId = input.required<number>();

  /** Emitálja a törlendő session-t - a szülő kezeli a confirm dialógust page-card-on kívül */
  readonly deleteRequested = output<GuestSession>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private readonly clipboardService = inject(ClipboardService);
  private destroyRef = inject(DestroyRef);
  private devLoginService = inject(DevLoginService);

  readonly ICONS = ICONS;
  readonly isDevMode = this.devLoginService.isDevMode();

  // State
  loading = signal(true);
  sessions = signal<GuestSession[]>([]);
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  search = '';
  activeFilter = signal<string>('');

  // Dialog states
  editingSession = signal<GuestSession | null>(null);
  deleting = signal(false);

  readonly filters = [
    { value: '', label: 'Összes' },
    { value: 'active', label: 'Aktív' },
    { value: 'banned', label: 'Tiltott' },
    { value: 'verified', label: 'Verifikált' },
    { value: 'pending', label: 'Függőben' },
  ];

  readonly filterSelectOptions: PsSelectOption[] = this.filters.filter(f => f.value !== '').map(f => ({ id: f.value, label: f.label }));

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);
    this.partnerService.getProjectGuestSessions(this.projectId(), {
      page: this.currentPage(),
      search: this.search.trim() || undefined,
      filter: this.activeFilter() || undefined,
      per_page: 15,
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: PaginatedResponse<GuestSession>) => {
        this.sessions.set(res.data);
        this.currentPage.set(res.current_page);
        this.lastPage.set(res.last_page);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Hiba', 'Nem sikerült a felhasználók betöltése.');
      },
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadSessions();
  }

  clearSearch(): void {
    this.search = '';
    this.currentPage.set(1);
    this.loadSessions();
  }

  onFilterChange(value: string): void {
    this.activeFilter.set(value);
    this.currentPage.set(1);
    this.loadSessions();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSessions();
  }

  // Edit dialog
  openEdit(session: GuestSession): void {
    this.editingSession.set(session);
  }

  closeEdit(): void {
    this.editingSession.set(null);
  }

  onEditSaved(): void {
    this.editingSession.set(null);
    this.loadSessions();
  }

  // Ban toggle
  toggleBan(session: GuestSession): void {
    this.partnerService.toggleBanGuestSession(this.projectId(), session.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.toast.success('Siker', res.message);
        this.loadSessions();
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült a művelet.');
      },
    });
  }

  // Delete - a confirm dialógust a szülő kezeli (page-card-on kívül)
  confirmDelete(session: GuestSession): void {
    this.deleteRequested.emit(session);
  }

  /** A szülő hívja meg, miután a confirm dialog-ban megerősítette a törlést */
  executeDelete(session: GuestSession): void {
    this.deleting.set(true);
    this.partnerService.deleteGuestSession(this.projectId(), session.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toast.success('Siker', 'Felhasználó törölve.');
        this.loadSessions();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('Hiba', 'Nem sikerült a törlés.');
      },
    });
  }

  getStatusBadgeClass(session: GuestSession): string {
    if (session.isBanned) return 'badge badge--red';
    if (session.verificationStatus === 'verified') return 'badge badge--green';
    if (session.verificationStatus === 'pending') return 'badge badge--yellow';
    return 'badge badge--gray';
  }

  getStatusLabel(session: GuestSession): string {
    if (session.isBanned) return 'Tiltott';
    if (session.verificationStatus === 'verified') return 'Verifikált';
    if (session.verificationStatus === 'pending') return 'Függőben';
    if (session.verificationStatus === 'rejected') return 'Elutasított';
    return 'Ismeretlen';
  }

  generateDevLogin(sessionId: number): void {
    this.devLoginService.generateDevLoginUrl('tablo-guest', sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.clipboardService.copyLink(res.url);
          this.toast.success('Dev login', 'URL vágólapra másolva (5 perc érvényes)');
        },
        error: () => {
          this.toast.error('Hiba', 'Nem sikerült a dev login URL generálása');
        }
      });
  }
}
