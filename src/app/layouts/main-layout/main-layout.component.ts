import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map, startWith, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, TabloProject } from '../../core/services/auth.service';
import { GuestService } from '../../core/services/guest.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PartnerBannerComponent } from '../../shared/components/partner-banner/partner-banner.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

/**
 * Main Layout Component
 *
 * Tartalmazza a navbar-t, router-outlet-et és footer-t.
 * Csak egyszer renderelődik, így nincs flicker route váltáskor.
 */
@Component({
    selector: 'app-main-layout',
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        NavbarComponent,
        PartnerBannerComponent,
        FooterComponent
    ]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  /** Projekt adatok a navbar-hoz */
  project$: Observable<TabloProject | null>;

  /** Aktív oldal a route data-ból */
  activePage$: Observable<'home' | 'samples' | 'order-data' | 'missing' | 'template-chooser' | 'order-finalization' | 'voting'>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private guestService: GuestService,
    private toastService: ToastService
  ) {
    // AuthService-ből közvetlenül a project observable
    this.project$ = this.authService.project$;

    // Route data-ból automatikus activePage detektálás
    this.activePage$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null), // Initial érték
      map(() => this.getActivePage())
    );
  }

  ngOnInit(): void {
    // Session invalidálás kezelése - TELJES kijelentkeztetés
    this.guestService.sessionInvalidated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      if (event.reason === 'banned') {
        this.toastService.error('Hozzáférés megtagadva', event.message, 8000);
      } else {
        this.toastService.info('Munkamenet lejárt', event.message, 5000);
      }
      // Teljes auth törlés (token + session + redirect /login-ra)
      this.authService.clearAuth();
    });

    // Session polling indítása ha van guest session
    // A timer(0, ...) azonnal lefut egyszer, majd 30 másodpercenként
    if (this.guestService.hasRegisteredSession()) {
      this.guestService.startSessionPolling();
    }
  }

  ngOnDestroy(): void {
    this.guestService.stopSessionPolling();
  }

  /**
   * Route data-ból kinyeri az activePage értéket
   */
  private getActivePage(): 'home' | 'samples' | 'order-data' | 'missing' | 'template-chooser' | 'order-finalization' | 'voting' {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data['page'] || 'home';
  }
}
