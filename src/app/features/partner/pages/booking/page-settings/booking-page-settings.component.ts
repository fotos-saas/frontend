import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { BookingPageSettings } from '../../../models/booking.models';

@Component({
  selector: 'app-booking-page-settings',
  standalone: true,
  imports: [LucideAngularModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-settings page-card page-card--narrow">
      <div class="page-header">
        <h1>Foglalasi oldal beallitasok</h1>
      </div>

      @if (loading()) {
        <div class="skeleton-form">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-field"></div>
          }
        </div>
      } @else {
        <div class="settings-form">
          <div class="field">
            <label>Foglalasi link</label>
            <div class="slug-input">
              <span class="slug-prefix">tablostudio.hu/booking/</span>
              <input type="text" [value]="slug()" (input)="slug.set($any($event.target).value)" placeholder="pl. kiss-foto" />
            </div>
          </div>

          <div class="field">
            <label>Logo URL</label>
            <input type="url" [value]="logoUrl()" (input)="logoUrl.set($any($event.target).value)" placeholder="https://..." />
          </div>

          <div class="field">
            <label>Elsodleges szin</label>
            <div class="color-row">
              <input type="color" [value]="primaryColor()" (input)="primaryColor.set($any($event.target).value)" />
              <input type="text" [value]="primaryColor()" (input)="primaryColor.set($any($event.target).value)" class="color-text" />
            </div>
          </div>

          <div class="field">
            <label>Hatterkep URL</label>
            <input type="url" [value]="bgImageUrl()" (input)="bgImageUrl.set($any($event.target).value)" placeholder="https://..." />
          </div>

          <div class="field">
            <label>Udvozlo szoveg</label>
            <textarea rows="3" [value]="welcomeText()" (input)="welcomeText.set($any($event.target).value)" placeholder="Udvozoljuk! Valasszon idopontot..."></textarea>
          </div>

          <div class="field">
            <label>Labszoveg</label>
            <input type="text" [value]="footerText()" (input)="footerText.set($any($event.target).value)" placeholder="Elhetosegek naponta frissulnek" />
          </div>

          <div class="toggle-group">
            <label class="toggle-label">
              <input type="checkbox" [checked]="showPrice()" (change)="showPrice.set($any($event.target).checked)" />
              <span>Ar megjelenitese</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" [checked]="darkMode()" (change)="darkMode.set($any($event.target).checked)" />
              <span>Sotet mod</span>
            </label>
          </div>

          @if (successMsg()) {
            <div class="success-msg">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16" /> {{ successMsg() }}
            </div>
          }

          <div class="form-actions">
            <button class="btn btn--primary" (click)="save()" [disabled]="saving()">
              @if (saving()) { Mentes... } @else { Mentes }
            </button>
            @if (slug()) {
              <a [href]="previewUrl()" target="_blank" class="btn btn--outline">
                <lucide-icon [name]="ICONS.EXTERNAL_LINK" [size]="16" /> Elonezet
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 1.5rem; font-weight: 600; margin: 0; }
    .skeleton-form { display: flex; flex-direction: column; gap: 16px; }
    .skeleton-field { height: 56px; border-radius: 8px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .settings-form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.85rem; font-weight: 500; color: #374151; }
    .field input, .field textarea { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .field textarea { resize: vertical; }
    .slug-input { display: flex; align-items: center; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
    .slug-prefix { padding: 8px 0 8px 12px; font-size: 0.85rem; color: #6b7280; white-space: nowrap; background: #f9fafb; }
    .slug-input input { border: none; padding: 8px 12px; flex: 1; outline: none; min-width: 0; }
    .color-row { display: flex; align-items: center; gap: 8px; }
    .color-row input[type="color"] { width: 40px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; padding: 2px; cursor: pointer; }
    .color-text { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .toggle-group { display: flex; flex-direction: column; gap: 12px; }
    .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; }
    .toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #7c3aed; }
    .success-msg { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: #ecfdf5; color: #059669; border-radius: 8px; font-size: 0.85rem; font-weight: 500; }
    .form-actions { display: flex; gap: 12px; padding-top: 8px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; text-decoration: none; }
    .btn--primary { background: #7c3aed; color: #fff; }
    .btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--outline { background: transparent; border: 1px solid #d1d5db; color: #374151; }
    @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `],
})
export class BookingPageSettingsComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  saving = signal(false);
  successMsg = signal('');

  slug = signal('');
  logoUrl = signal('');
  primaryColor = signal('#7c3aed');
  bgImageUrl = signal('');
  welcomeText = signal('');
  footerText = signal('');
  showPrice = signal(true);
  darkMode = signal(false);

  previewUrl = computed(() => `https://tablostudio.hu/booking/${this.slug()}`);

  ngOnInit(): void {
    this.bookingService.getPageSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const d = res.data;
          if (d.booking_slug) this.slug.set(d.booking_slug);
          if (d.booking_page_settings) {
            const ps = d.booking_page_settings;
            if (ps.logo_url) this.logoUrl.set(ps.logo_url);
            if (ps.primary_color) this.primaryColor.set(ps.primary_color);
            if (ps.background_image_url) this.bgImageUrl.set(ps.background_image_url);
            if (ps.welcome_text) this.welcomeText.set(ps.welcome_text);
            if (ps.footer_text) this.footerText.set(ps.footer_text);
            if (ps.show_price !== undefined) this.showPrice.set(ps.show_price);
            if (ps.dark_mode !== undefined) this.darkMode.set(ps.dark_mode);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  save(): void {
    this.saving.set(true);
    this.successMsg.set('');
    const payload: Partial<BookingPageSettings> = {
      booking_slug: this.slug() || null,
      booking_page_settings: {
        logo_url: this.logoUrl() || undefined,
        primary_color: this.primaryColor() || undefined,
        background_image_url: this.bgImageUrl() || undefined,
        welcome_text: this.welcomeText() || undefined,
        footer_text: this.footerText() || undefined,
        show_price: this.showPrice(),
        dark_mode: this.darkMode(),
      },
    };
    this.bookingService.updatePageSettings(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.saving.set(false); this.successMsg.set('Beallitasok mentve!'); },
        error: () => this.saving.set(false),
      });
  }
}
