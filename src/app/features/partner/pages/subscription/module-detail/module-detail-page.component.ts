import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, DestroyRef, ElementRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { MarketplaceService } from '../../../services/marketplace.service';
import { PartnerModule } from '../../../models/marketplace.models';
import { MODULE_DETAIL_CONTENTS } from './module-detail-content.data';
import { ModuleDetailContent } from './module-detail.types';
import { DetailHeroComponent } from './sections/detail-hero/detail-hero.component';
import { DetailBenefitsComponent } from './sections/detail-benefits/detail-benefits.component';
import { DetailHowItWorksComponent } from './sections/detail-how-it-works/detail-how-it-works.component';
import { DetailScreenshotsComponent } from './sections/detail-screenshots/detail-screenshots.component';
import { DetailPricingComponent } from './sections/detail-pricing/detail-pricing.component';
import { DetailFaqComponent } from './sections/detail-faq/detail-faq.component';

@Component({
  selector: 'app-module-detail-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    RouterLink,
    ScrollRevealDirective,
    DetailHeroComponent,
    DetailBenefitsComponent,
    DetailHowItWorksComponent,
    DetailScreenshotsComponent,
    DetailPricingComponent,
    DetailFaqComponent,
  ],
  templateUrl: './module-detail-page.component.html',
  styleUrl: './module-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly heroSection = viewChild<ElementRef>('heroSection');
  readonly showStickyCta = signal(false);

  readonly moduleKey = signal<string>('');

  /** Statikus marketing tartalom */
  readonly content = computed<ModuleDetailContent | null>(() => {
    const key = this.moduleKey();
    return key ? (MODULE_DETAIL_CONTENTS[key] ?? null) : null;
  });

  /** Partner modul adatok (állapot, ár) */
  readonly module = computed<PartnerModule | null>(() => {
    const key = this.moduleKey();
    return this.marketplaceService.modules().find(m => m.key === key) ?? null;
  });

  /** Kapcsolódó modulok teljes adattal */
  readonly relatedModules = computed(() => {
    const c = this.content();
    if (!c) return [];
    const allModules = this.marketplaceService.modules();
    return c.relatedModuleKeys
      .map(key => allModules.find(m => m.key === key))
      .filter((m): m is PartnerModule => !!m);
  });

  /** Függőségi modulok (depends_on) */
  readonly dependsOnModules = computed(() => {
    const mod = this.module();
    if (!mod?.depends_on?.length) return [];
    const allModules = this.marketplaceService.modules();
    return mod.depends_on
      .map(key => allModules.find(m => m.key === key))
      .filter((m): m is PartnerModule => !!m);
  });

  readonly loading = this.marketplaceService.loading;

  /** Lightbox — page-card-on kívül renderelve */
  readonly screenshotLightboxIndex = signal<number | null>(null);

  private heroObserver: IntersectionObserver | null = null;

  ngOnInit(): void {
    // Modulok betöltése ha még nincs
    if (this.marketplaceService.modules().length === 0) {
      this.marketplaceService.getModules().subscribe();
    }

    // Route param figyelés
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const key = params.get('moduleKey') ?? '';
      this.moduleKey.set(key);

      // Ha nincs ilyen modul, vissza a marketplace-re
      if (key && !MODULE_DETAIL_CONTENTS[key]) {
        this.router.navigate(['/partner/subscription/marketplace']);
        return;
      }

      // Scroll to top ha route változik
      window.scrollTo({ top: 0 });
    });

    this.setupHeroObserver();
  }

  activateModule(): void {
    const key = this.moduleKey();
    if (key) {
      this.marketplaceService.activateModule(key).subscribe();
    }
  }

  nextScreenshot(total: number): void {
    const current = this.screenshotLightboxIndex();
    if (current === null) return;
    this.screenshotLightboxIndex.set((current + 1) % total);
  }

  prevScreenshot(total: number): void {
    const current = this.screenshotLightboxIndex();
    if (current === null) return;
    this.screenshotLightboxIndex.set((current - 1 + total) % total);
  }

  private setupHeroObserver(): void {
    // prefers-reduced-motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Sticky CTA observer — csak mobil
    const checkMobile = () => window.innerWidth <= 768;

    this.heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (checkMobile() && !prefersReducedMotion) {
          this.showStickyCta.set(!entry.isIntersecting);
        }
      },
      { threshold: 0 }
    );

    // A heroSection-t a DOM render után kötjük be
    setTimeout(() => {
      const heroEl = this.heroSection()?.nativeElement;
      if (heroEl) {
        this.heroObserver?.observe(heroEl);
      }
    }, 100);

    this.destroyRef.onDestroy(() => this.heroObserver?.disconnect());
  }
}
