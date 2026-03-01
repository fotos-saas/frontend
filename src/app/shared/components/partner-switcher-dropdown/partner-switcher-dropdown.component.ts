import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { PartnerSwitchService } from '../../../core/services/auth/partner-switch.service';
import type { PartnerOption } from '../../../core/models/auth.models';

/**
 * Partner Switcher Dropdown
 *
 * Top-bar-ba épülő partner-váltó dropdown.
 * Jelenlegi partner neve + chevron → dropdown lista → kattintás = váltás + reload.
 */
@Component({
  selector: 'app-partner-switcher-dropdown',
  standalone: true,
  imports: [NgClass],
  templateUrl: './partner-switcher-dropdown.component.html',
  styleUrls: ['./partner-switcher-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerSwitcherDropdownComponent implements OnInit {
  private readonly partnerSwitchService = inject(PartnerSwitchService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  readonly currentPartnerId = input.required<number>();
  readonly partnerSwitched = output<void>();

  readonly isOpen = signal(false);
  readonly partners = signal<PartnerOption[]>([]);
  readonly loading = signal(false);
  readonly switching = signal(false);
  readonly currentPartnerName = signal<string>('');
  readonly partnerInitial = computed(() => {
    const name = this.currentPartnerName();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.isOpen.set(false);
  }

  ngOnInit(): void {
    this.loadPartners();
  }

  private loadPartners(): void {
    this.loading.set(true);
    this.partnerSwitchService.getMyPartners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.partners.set(response.partners);
          const current = response.partners.find(p => p.partner_id === this.currentPartnerId());
          if (current) {
            this.currentPartnerName.set(current.partner_name);
          }
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  selectPartner(partner: PartnerOption): void {
    if (this.switching() || partner.partner_id === this.currentPartnerId()) {
      this.isOpen.set(false);
      return;
    }

    this.switching.set(true);
    this.isOpen.set(false);

    this.partnerSwitchService.switchPartner(partner.partner_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          sessionStorage.setItem('marketer_token', response.token);
          sessionStorage.setItem('marketer_user', JSON.stringify(response.user));
          this.partnerSwitched.emit();
          // Hard reload: cache-bust-tal, hogy a régi partner adatok ne maradjanak
          const base = window.location.pathname;
          window.location.href = `${base}?_sw=${Date.now()}`;
        },
        error: () => {
          this.switching.set(false);
        }
      });
  }

  isCurrent(partner: PartnerOption): boolean {
    return partner.partner_id === this.currentPartnerId();
  }
}
