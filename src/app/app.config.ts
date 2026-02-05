import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideSentry, SentryService } from './core/services/sentry.service';
import { LUCIDE_ICONS_MAP } from './shared/constants/lucide-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS_MAP)),
    {
      provide: APP_INITIALIZER,
      useFactory: (sentryService: SentryService) => () => sentryService.init(),
      deps: [SentryService],
      multi: true
    },
    ...provideSentry(),
  ]
};
