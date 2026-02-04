import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService, ContactListItem, ContactLimits } from '../services/partner.service';
import { ContactEditModalComponent } from '../components/contact-edit-modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UpgradeDialogComponent } from '../../../shared/components/upgrade-dialog/upgrade-dialog.component';
import { ICONS } from '../../../shared/constants/icons.constants';
import { useFilterState, FilterStateApi } from '../../../shared/utils/use-filter-state';

/**
 * Partner Contact List - Kapcsolattartók listája a partner felületen.
 * Paginált táblázatos nézet, CRUD műveletekkel.
 */
@Component({
  selector: 'app-partner-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ContactEditModalComponent,
    ConfirmDialogComponent,
    UpgradeDialogComponent
  ],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerContactListComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;

  // Filter state - központosított perzisztencia rendszerrel
  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'contacts' },
    defaultFilters: {},
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    onStateChange: () => this.loadContacts(),
  });

  contacts = signal<ContactListItem[]>([]);
  totalPages = signal(1);
  totalContacts = signal(0);
  contactLimits = signal<ContactLimits | null>(null);

  // Modals
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  showUpgradeDialog = signal(false);
  selectedContact = signal<ContactListItem | null>(null);
  modalMode = signal<'create' | 'edit'>('create');

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.filterState.loading.set(true);

    this.partnerService.getContacts({
      page: this.filterState.page(),
      per_page: 18,
      search: this.filterState.search() || undefined
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.contacts.set(response.data);
          this.totalPages.set(response.last_page);
          this.totalContacts.set(response.total);
          this.contactLimits.set(response.limits ?? null);
          this.filterState.loading.set(false);
        },
        error: () => {
          this.filterState.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filterState.setPage(page);
  }

  viewProject(contact: ContactListItem): void {
    // Navigate to the first project if available
    const projectId = contact.projectIds?.[0] ?? contact.projectId;
    if (projectId) {
      this.router.navigate(['/partner/projects', projectId]);
    }
  }

  onNewContactClick(): void {
    if (this.contactLimits() && !this.contactLimits()!.can_create) {
      // UpgradeDialog kezeli a csapattag üzenetet is
      this.showUpgradeDialog.set(true);
    } else {
      this.openCreateModal();
    }
  }

  openCreateModal(): void {
    this.selectedContact.set(null);
    this.modalMode.set('create');
    this.showEditModal.set(true);
  }

  editContact(contact: ContactListItem): void {
    this.selectedContact.set(contact);
    this.modalMode.set('edit');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedContact.set(null);
  }

  onContactSaved(contact: ContactListItem): void {
    this.closeEditModal();
    this.loadContacts();
  }

  confirmDeleteContact(contact: ContactListItem): void {
    this.selectedContact.set(contact);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.selectedContact.set(null);
  }

  deleteContact(): void {
    const contact = this.selectedContact();
    if (!contact) return;

    this.partnerService.deleteStandaloneContact(contact.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDeleteConfirm();
          this.loadContacts();
        },
        error: () => {
          this.closeDeleteConfirm();
        }
      });
  }
}
