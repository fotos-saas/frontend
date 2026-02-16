import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerSwitchService } from '@core/services/auth/partner-switch.service';
import { ICONS } from '@shared/constants/icons.constants';
import type { PendingInvitation } from '@core/models/auth.models';

@Component({
  selector: 'app-invite-banner',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './invite-banner.component.html',
  styleUrl: './invite-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InviteBannerComponent implements OnInit {
  private readonly partnerSwitchService = inject(PartnerSwitchService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  invitations = signal<PendingInvitation[]>([]);
  accepting = signal<string | null>(null);
  dismissed = signal<Set<number>>(new Set());

  /** Szűrt meghívók (dismisselt kizárva) */
  get visibleInvitations(): PendingInvitation[] {
    return this.invitations().filter(inv => !this.dismissed().has(inv.id));
  }

  ngOnInit(): void {
    this.loadInvitations();
  }

  private loadInvitations(): void {
    this.partnerSwitchService.getPendingInvitations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.invitations.set(response.invitations),
        error: () => {} // Csendben kezeljük - nincs meghívó, nincs banner
      });
  }

  accept(invitation: PendingInvitation): void {
    this.accepting.set(invitation.code);

    this.partnerSwitchService.acceptInvitation(invitation.code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.token) {
            sessionStorage.setItem('marketer_token', response.token);
            sessionStorage.setItem('marketer_user', JSON.stringify(response.user));
            window.location.href = '/partner/dashboard';
          }
        },
        error: () => {
          this.accepting.set(null);
        }
      });
  }

  dismiss(invitation: PendingInvitation): void {
    this.dismissed.update(set => {
      const newSet = new Set(set);
      newSet.add(invitation.id);
      return newSet;
    });
  }
}
