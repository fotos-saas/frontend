import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeamService, TeamMember, PendingInvitation, TeamRole } from '../../services/team.service';
import { InviteDialogComponent } from './invite-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Partner Team List - Csapatom oldal
 * Csapattagok és meghívók kezelése.
 */
@Component({
  selector: 'app-partner-team-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    InviteDialogComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerTeamListComponent implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // Adatok
  members = signal<TeamMember[]>([]);
  pendingInvitations = signal<PendingInvitation[]>([]);
  loading = signal(true);

  // Modals
  showInviteModal = signal(false);
  showRemoveConfirm = signal(false);
  showRevokeConfirm = signal(false);
  selectedMember = signal<TeamMember | null>(null);
  selectedInvitation = signal<PendingInvitation | null>(null);

  // Lenyitott meghívó id-k
  expandedInvitations = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadTeam();
  }

  loadTeam(): void {
    this.loading.set(true);

    this.teamService.getTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.members.set(response.members);
          this.pendingInvitations.set(response.pendingInvitations);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  // Meghívó kezelés
  openInviteModal(): void {
    this.showInviteModal.set(true);
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
  }

  onInviteSent(): void {
    this.closeInviteModal();
    this.loadTeam();
  }

  // Meghívó visszavonás
  confirmRevokeInvitation(invitation: PendingInvitation): void {
    this.selectedInvitation.set(invitation);
    this.showRevokeConfirm.set(true);
  }

  closeRevokeConfirm(): void {
    this.showRevokeConfirm.set(false);
    this.selectedInvitation.set(null);
  }

  revokeInvitation(): void {
    const invitation = this.selectedInvitation();
    if (!invitation) return;

    this.teamService.revokeInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeRevokeConfirm();
          this.loadTeam();
        },
        error: () => {
          this.closeRevokeConfirm();
        }
      });
  }

  // Meghívó újraküldés
  resendInvitation(invitation: PendingInvitation): void {
    this.teamService.resendInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // Csapattag eltávolítás
  confirmRemoveMember(member: TeamMember): void {
    this.selectedMember.set(member);
    this.showRemoveConfirm.set(true);
  }

  closeRemoveConfirm(): void {
    this.showRemoveConfirm.set(false);
    this.selectedMember.set(null);
  }

  removeMember(): void {
    const member = this.selectedMember();
    if (!member) return;

    this.teamService.removeTeamMember(member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeRemoveConfirm();
          this.loadTeam();
        },
        error: () => {
          this.closeRemoveConfirm();
        }
      });
  }

  // Helper: szerepkör szín
  getRoleBadgeClass(role: TeamRole): string {
    const colors: Record<TeamRole, string> = {
      designer: 'bg-purple-100 text-purple-700',
      marketer: 'bg-blue-100 text-blue-700',
      printer: 'bg-orange-100 text-orange-700',
      assistant: 'bg-green-100 text-green-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  }

  // Helper: lejárat formázás
  formatExpiry(dateStr: string | null): string {
    if (!dateStr) return 'Nincs lejárat';
    const date = new Date(dateStr);
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Lejárt';
    if (days === 1) return '1 nap múlva lejár';
    return `${days} nap múlva lejár`;
  }

  // Lenyitás toggle
  toggleExpand(invitationId: number): void {
    const current = this.expandedInvitations();
    const newSet = new Set(current);
    if (newSet.has(invitationId)) {
      newSet.delete(invitationId);
    } else {
      newSet.add(invitationId);
    }
    this.expandedInvitations.set(newSet);
  }

  isExpanded(invitationId: number): boolean {
    return this.expandedInvitations().has(invitationId);
  }

  // Clipboard másolás
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }
}
