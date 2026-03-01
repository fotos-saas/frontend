import { Component, OnInit, signal, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { PartnerSwitchService } from '../../core/services/auth/partner-switch.service';
import type { PartnerOption } from '../../core/models/auth.models';

/** Role szín konfigurációk */
const ROLE_COLORS: Record<string, string> = {
  designer: 'purple',
  marketer: 'blue',
  printer: 'green',
  assistant: 'amber',
};

/**
 * Partner Select - Fullscreen partner-választó oldal.
 *
 * Több partnerhez tartozó csapattagok számára.
 * Session Chooser mintájú glassmorphism kártyák.
 * 1 partner = auto-redirect (skip választó).
 */
@Component({
  selector: 'app-partner-select',
  standalone: true,
  imports: [NgClass],
  templateUrl: './partner-select.component.html',
  styleUrls: ['./partner-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerSelectComponent implements OnInit {
  private readonly partnerSwitchService = inject(PartnerSwitchService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly partners = signal<PartnerOption[]>([]);
  readonly currentPartnerId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly switching = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPartners();
  }

  private loadPartners(): void {
    this.partnerSwitchService.getMyPartners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.currentPartnerId.set(response.current_partner_id);

          if (response.partners.length <= 1) {
            // 1 partner = auto-redirect
            this.router.navigate(['/partner/dashboard']);
            return;
          }

          this.partners.set(response.partners);
        },
        error: (err: Error) => {
          this.loading.set(false);
          this.error.set(err.message);
        }
      });
  }

  selectPartner(partner: PartnerOption): void {
    if (this.switching()) return;

    // Ha már ezen a partneren vagyunk, csak navigálunk
    if (partner.partner_id === this.currentPartnerId()) {
      this.router.navigate(['/partner/dashboard']);
      return;
    }

    this.switching.set(true);
    this.error.set(null);

    this.partnerSwitchService.switchPartner(partner.partner_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Token + user frissítés sessionStorage-ban
          sessionStorage.setItem('marketer_token', response.token);
          sessionStorage.setItem('marketer_user', JSON.stringify(response.user));

          // Hard reload cache-bust-tal, hogy a régi partner adatok ne maradjanak
          window.location.href = `/partner/dashboard?_sw=${Date.now()}`;
        },
        error: (err: Error) => {
          this.switching.set(false);
          this.error.set(err.message);
        }
      });
  }

  onCardKeydown(event: KeyboardEvent, partner: PartnerOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectPartner(partner);
    }
  }

  getRoleColor(role: string): string {
    return ROLE_COLORS[role] || 'blue';
  }

  isCurrent(partner: PartnerOption): boolean {
    return partner.partner_id === this.currentPartnerId();
  }
}
