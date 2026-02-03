import { Component, ChangeDetectionStrategy, inject, OnInit, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { CapacitorService } from './core/services/capacitor.service';
import { AppUpdateService } from './core/services/app-update.service';
import { SentryService } from './core/services/sentry.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
    private router = inject(Router);
    private capacitorService = inject(CapacitorService);
    private appUpdateService = inject(AppUpdateService);
    private sentryService = inject(SentryService);
    private destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        // Setup deep link handling for mobile app
        this.setupDeepLinkHandler();

        // Initialize OTA update checker
        if (this.capacitorService.isNative()) {
            this.appUpdateService.initialize();
        }

        // Setup navigation breadcrumbs for Sentry
        this.setupNavigationBreadcrumbs();
    }

    private setupDeepLinkHandler(): void {
        this.capacitorService.onDeepLink((path: string) => {
            // Navigate to the path from deep link
            this.router.navigateByUrl(path);
        });
    }

    /**
     * Navigation breadcrumbs - Sentry-nek küldi a navigációs történetet
     * Hiba esetén látható lesz, hogy milyen útvonalakon járt a felhasználó
     */
    private setupNavigationBreadcrumbs(): void {
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(event => {
            this.sentryService.addBreadcrumb(
                `Navigáció: ${event.urlAfterRedirects}`,
                'navigation',
                {
                    from: event.url !== event.urlAfterRedirects ? event.url : undefined,
                    to: event.urlAfterRedirects
                }
            );
        });
    }
}
