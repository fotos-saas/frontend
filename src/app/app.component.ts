import { Component, ChangeDetectionStrategy, inject, OnInit, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { CapacitorService } from './core/services/capacitor.service';
import { AppUpdateService } from './core/services/app-update.service';
import { SentryService } from './core/services/sentry.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TopLoadingBarComponent } from './shared/components/top-loading-bar/top-loading-bar.component';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';
import { ErrorFeedbackDialogComponent } from './shared/components/error-feedback-dialog/error-feedback-dialog.component';
import { TabManagerService } from './core/tab-system/services/tab-manager.service';
import { TabKeyboardService } from './core/tab-system/services/tab-keyboard.service';
import { TabBarComponent } from './core/tab-system/components/tab-bar/tab-bar.component';
import { TabContentHostComponent } from './core/tab-system/components/tab-content-host/tab-content-host.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    imports: [
        RouterOutlet,
        ToastComponent,
        TopLoadingBarComponent,
        OfflineBannerComponent,
        ErrorFeedbackDialogComponent,
        TabBarComponent,
        TabContentHostComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
    private router = inject(Router);
    private capacitorService = inject(CapacitorService);
    private appUpdateService = inject(AppUpdateService);
    private sentryService = inject(SentryService);
    private destroyRef = inject(DestroyRef);
    private document = inject(DOCUMENT);

    readonly tabManager = inject(TabManagerService);
    private readonly tabKeyboard = inject(TabKeyboardService);

    ngOnInit(): void {
        // Setup deep link handling for mobile app
        this.setupDeepLinkHandler();

        // Initialize OTA update checker
        if (this.capacitorService.isNative()) {
            this.appUpdateService.initialize();
        }

        // Setup navigation breadcrumbs for Sentry
        this.setupNavigationBreadcrumbs();

        // Splash screen eltüntetése az első NavigationEnd-re
        this.hideSplashOnFirstNavigation();

        // Tab rendszer inicializalasa (csak Electron modban)
        if (this.tabManager.isTabSystemEnabled()) {
            this.tabManager.initialize();
            this.tabKeyboard.initialize();
        }
    }

    private setupDeepLinkHandler(): void {
        this.capacitorService.onDeepLink((path: string) => {
            // Navigate to the path from deep link
            this.router.navigateByUrl(path);
        });
    }

    /**
     * Splash screen eltüntetése az első sikeres navigáció után.
     * Addig látszik, amíg a guard-ok + lazy load-ok le nem futnak.
     */
    private hideSplashOnFirstNavigation(): void {
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            take(1),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            const splash = this.document.getElementById('splash-screen');
            if (!splash) return;
            splash.classList.add('splash-fade-out');
            splash.addEventListener('transitionend', () => splash.remove(), { once: true });
            // Fallback: ha a transition nem triggerelődik (pl. reduced-motion)
            setTimeout(() => splash.remove(), 500);
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
